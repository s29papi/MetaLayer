// 1️⃣ Narrow set of common MIME types (string union preserves autocomplete)
export type FileMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/gif"
  | "image/webp"
  | "video/mp4"
  | "video/webm"
  | "audio/mpeg"
  | "audio/wav"
  | "application/pdf"
  | "text/csv"
  | "application/json"
  | "text/plain"
  | "application/octet-stream" // fallback
  ;

// 2️⃣ Extension union for common extensions
export type FileExtension =
  | ".jpg" | ".jpeg"
  | ".png"
  | ".gif"
  | ".webp"
  | ".mp4"
  | ".webm"
  | ".mp3"
  | ".wav"
  | ".pdf"
  | ".csv"
  | ".json"
  | ".txt"
  | string; // allow uncommon extensions

export type FileCategory = "image" | "video" | "audio" | "document" | "dataset" | "other";

// 3️⃣ Define your metadata structure
export interface OGFileCtx {
  fileType: FileMimeType      
  extension: FileExtension
  category?: FileCategory    
  dateAdded: bigint     // uint256 (BigInt required by viem)
  encrypted: boolean    
  creator: string       // address
}


// 4️⃣ Canonical ABI parameter layout (must match Solidity struct order)
export const OG_FILE_CTX_TYPES = [
  { name: 'fileType', type: 'string' },
  { name: 'extension', type: 'string' },
  { name: 'dateAdded', type: 'uint256' },
  { name: 'encrypted', type: 'bool' },
  { name: 'creator', type: 'address' },
]

// 
export function mimeToCategory(mime: FileMimeType): FileCategory {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  if (mime === "application/pdf" || mime === "text/csv" || mime === "text/plain") return "document";
  if (mime === "application/json") return "dataset";
  return "other";
}
