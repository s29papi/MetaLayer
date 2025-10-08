"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetaLayerClient = void 0;
const viem_1 = require("viem");
const _0g_ts_sdk_1 = require("@0glabs/0g-ts-sdk");
const ethers_1 = require("ethers");
const consts_1 = require("./consts");
class MetaLayerClient {
    // Keep constructor empty — methods accept indexer/network/wallet as before
    constructor() { }
    // 3️⃣ Encode (kept same logic)
    static encodeOGFileCtx(ctx) {
        return (0, viem_1.encodeAbiParameters)(consts_1.OG_FILE_CTX_TYPES, [
            // ctx.rootHash,
            ctx.fileType,
            ctx.extension,
            ctx.dateAdded,
            ctx.encrypted,
            ctx.creator,
        ]);
    }
    // uploadWithCtx (moved into class, logic unchanged)
    async uploadWithCtx(indexer, ctx, file, network, wallet) {
        const blob = new _0g_ts_sdk_1.Blob(file);
        const [tree, treeErr] = await blob.merkleTree();
        if (treeErr !== null) {
            throw new Error(`Error generating Merkle tree: ${treeErr}`);
        }
        const totalChunks = blob.numChunks();
        const rootHash = tree?.rootHash();
        const encodedAbiPrameters = MetaLayerClient.encodeOGFileCtx(ctx);
        try {
            if (await this.isOnchainAwareCtx(rootHash, network, wallet)) {
                throw new Error('File and RootHash already exist');
                return;
            }
            const [tx, uploadErr] = await indexer.upload(blob, network.rpcUrl, wallet);
            if (uploadErr !== null) {
                throw new Error(`Upload error: ${uploadErr}`);
            }
            console.log('Upload successful! Transaction:', tx);
            await this.makeOnchainAwareCtx(rootHash, encodedAbiPrameters, network, wallet);
            return { rootHash, txHash: tx, totalChunks };
        }
        catch (e) {
            console.error('Upload failed:', e);
            return { rootHash, totalChunks, txHash: null, error: e.message };
        }
    }
    // isOnchainAwareCtx (moved into class, logic unchanged)
    async isOnchainAwareCtx(rootHash, network, wallet) {
        if (!rootHash || rootHash?.length < 2) {
            throw new Error('isOnchainAwareCtx: rootHash is required but was null or undefined');
        }
        if (!network?.metaLayerAddress) {
            throw new Error('isOnchainAwareCtx: network.metaLayerAddress is missing');
        }
        const abi = ['function exists(bytes32 rootHash) view returns (bool)'];
        const contract = new ethers_1.ethers.Contract(network?.metaLayerAddress, abi, wallet);
        try {
            const ex = await contract.exists(rootHash);
            return Boolean(ex);
        }
        catch (e) {
            console.warn('isOnchainAwareCtx read failed:', e);
            return false;
        }
    }
    async getOnchainAwareCtx(rootHash, network, wallet) {
        if (!rootHash || rootHash?.length < 2) {
            throw new Error('isOnchainAwareCtx: rootHash is required but was null or undefined');
        }
        if (!network?.metaLayerAddress) {
            throw new Error("getOnchainAwareCtx: network.metaLayerAddress is missing");
        }
        const abi = ["function getCtx(bytes32 rootHash) view returns (bytes)"];
        const contract = new ethers_1.ethers.Contract(network?.metaLayerAddress, abi, wallet);
        try {
            const data = await contract.getCtx(rootHash);
            if (!data || data === "0x") {
                console.warn("getOnchainAwareCtx: no context found for rootHash", rootHash);
                return null;
            }
            return data;
        }
        catch (e) {
            console.warn("getOnchainAwareCtx read failed:", e);
            return null;
        }
    }
    // makeOnchainAwareCtx (moved into class, logic unchanged)
    async makeOnchainAwareCtx(rootHash, ctxEncoded, network, wallet) {
        const abi = ['function createCtx(bytes32 rootHash, bytes calldata encodedCtx) payable'];
        const contract = new ethers_1.ethers.Contract(network?.metaLayerAddress, abi, wallet);
        try {
            const tx = await contract.createCtx(rootHash, ctxEncoded, { value: ethers_1.ethers.parseEther('0.0001') });
            await tx.wait();
            console.log('ctx created:', tx.hash);
        }
        catch (e) {
            console.warn('makeOnchainAwareCtx write failed:', e);
            return;
        }
    }
    // 4️⃣ Decode (kept same logic)
    decodeOGFileCtx(encoded) {
        const [fileType, extension, dateAdded, encrypted, creator] = (0, viem_1.decodeAbiParameters)(consts_1.OG_FILE_CTX_TYPES, encoded);
        return {
            fileType,
            extension,
            dateAdded,
            encrypted,
            creator,
        };
    }
}
exports.MetaLayerClient = MetaLayerClient;
exports.default = MetaLayerClient;
