import { FileExtension, FileMimeType, mimeToCategory, OGFileCtx } from "./consts";
import type { Indexer } from "@0glabs/0g-ts-sdk";
import { fileTypeFromBuffer } from "file-type";
import fs from "fs";
import path from "path";
import os from "os";

const HEAD_BYTES = 8192; // read first 8KB for detection


const extToMime: Record<string, FileMimeType> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".json": "application/json",
  ".txt": "text/plain",
};

export function extensionFromFilename(filename: string): FileExtension {
  const idx = filename.lastIndexOf(".");
  if (idx === -1) return "";
  return filename.slice(idx).toLowerCase() as FileExtension;
}

export function mimeFromFilename(filename: string): FileMimeType {
  const ext = extensionFromFilename(filename);
  return (extToMime[ext] ?? "application/octet-stream") as FileMimeType;
}


export function detectFileCtxFromName(filename: string, creator: string) {
  const extension = extensionFromFilename(filename);
  const mime = mimeFromFilename(filename);
  const category = mimeToCategory(mime);
  return {
    version: 1,
    fileType: mime,
    extension,
    category,
    dateAdded: BigInt(Date.now()),
    encrypted: false,
    creator,
  };
}

export function validateOGFileCtx(ctx: OGFileCtx): { ok: true } | { ok: false; reason: string } {
  if (!ctx.creator || !ctx.creator.startsWith("0x") || ctx.creator.length !== 42) {
    return { ok: false, reason: "invalid creator address" };
  }
  if (typeof ctx.dateAdded !== "bigint") {
    return { ok: false, reason: "dateAdded must be BigInt" };
  }
  // ensure MIME is string and contains slash
  if (typeof ctx.fileType !== "string" || ctx.fileType.indexOf("/") === -1) {
    return { ok: false, reason: "fileType must be a MIME string like 'video/mp4'" };
  }
  if (typeof ctx.encrypted !== "boolean") {
    return { ok: false, reason: "encrypted must be boolean" };
  }
  return { ok: true };
}


function isProbablyUtf8Text(buf: Buffer, printableThreshold = 0.9) {
  if (!buf || buf.length === 0) return false;

  // If buffer contains a NULL byte, treat as binary
  for (let i = 0; i < buf.length; i++) {
    if (buf[i] === 0) return false;
  }

  // Count printable ASCII + common whitespace (tab/newline/carriage)
  let printable = 0;
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    // 0x20 - 0x7E printable ASCII, allow \n(10), \r(13), \t(9)
    if ((b >= 0x20 && b <= 0x7e) || b === 10 || b === 13 || b === 9) printable++;
  }
  const ratio = printable / buf.length;
  return ratio >= printableThreshold;
}

function detectCsv(buf: Buffer) {
  // Quick heuristic: presence of commas and newlines and consistent column counts on first few lines
  const s = buf.toString("utf8", 0, Math.min(buf.length, 16 * 1024));
  if (!s.includes(",") || !s.includes("\n")) return false;

  const lines = s.split(/\r?\n/).filter(Boolean).slice(0, 20);
  if (lines.length < 2) return false;
  const counts = lines.map(l => l.split(",").length);
  const first = counts[0];
  // require most lines to have same column count as first
  const sameCount = counts.filter(c => c === first).length;
  return sameCount / counts.length >= 0.6;
}

/**
 * Downloads full file to temp, detects type, renames to appropriate extension.
 */
export async function retrieveAndAssignFileType(indexer: Indexer, rootHash: string, outDir = process.cwd()) {
  const tmpPath = path.join(os.tmpdir(), `0g-${rootHash}.tmp`);
  const finalFallback = path.join(outDir, `${rootHash}.bin`);

  // 1) Download full file to temporary path (SDK call)
  const err = await (indexer as any).download(rootHash, tmpPath, true);
  if (err !== null) throw new Error(`Download error: ${err}`);

  // 2) Read first HEAD_BYTES
  const fd = fs.openSync(tmpPath, "r");
  const headBuf = Buffer.alloc(HEAD_BYTES);
  const bytesRead = fs.readSync(fd, headBuf, 0, HEAD_BYTES, 0);
  fs.closeSync(fd);
  const headSlice = headBuf.slice(0, bytesRead);

  // 3) Try file-type (binary/magic bytes)
  const ft = await fileTypeFromBuffer(headSlice);
  if (ft) {
    const finalPath = path.join(outDir, `${rootHash}.${ft.ext}`);
    fs.renameSync(tmpPath, finalPath);
    return { path: finalPath, mime: ft.mime, ext: ft.ext };
  }

  // 4) Try JSON first (fast & common)
  const headStringPreview = headSlice.toString("utf8", 0, Math.min(1024, headSlice.length)).trimStart();
  if (headStringPreview.startsWith("{") || headStringPreview.startsWith("[")) {
    const finalPath = path.join(outDir, `${rootHash}.json`);
    fs.renameSync(tmpPath, finalPath);
    return { path: finalPath, mime: "application/json", ext: "json" };
  }

  // 5) Check if buffer seems to be UTF-8 text
  if (isProbablyUtf8Text(headSlice, 0.85)) {
    // a) CSV heuristic
    if (detectCsv(headSlice)) {
      const finalPath = path.join(outDir, `${rootHash}.csv`);
      fs.renameSync(tmpPath, finalPath);
      return { path: finalPath, mime: "text/csv", ext: "csv" };
    }
    // b) plain text
    const finalPath = path.join(outDir, `${rootHash}.txt`);
    fs.renameSync(tmpPath, finalPath);
    return { path: finalPath, mime: "text/plain", ext: "txt" };
  }

  // 6) Unknown -> leave as .bin
  fs.renameSync(tmpPath, finalFallback);
  return { path: finalFallback, mime: "application/octet-stream", ext: "bin" };
}