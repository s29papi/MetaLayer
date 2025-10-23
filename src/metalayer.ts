import { encodeAbiParameters, decodeAbiParameters } from 'viem'
import type {Indexer} from '@0glabs/0g-ts-sdk'
import { Blob } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';

import { NetworkConfig } from './network';
import { OGFileCtx, OG_FILE_CTX_TYPES } from './consts';
import type { Wallet} from 'ethers';

export class MetaLayerClient {
  // Keep constructor empty — methods accept indexer/network/wallet as before
  constructor() {}

  // 3️⃣ Encode (kept same logic)
  static encodeOGFileCtx(ctx: OGFileCtx): `0x${string}` {
    return encodeAbiParameters(OG_FILE_CTX_TYPES, [
      ctx.fileType,
      ctx.extension,
      ctx.dateAdded,
      ctx.encrypted,
      ctx.creator,
    ])
  }

  // uploadWithCtx (moved into class, logic unchanged)
  async uploadWithCtx(
    indexer: Indexer,
    ctx: OGFileCtx,
    file: File,
    network: NetworkConfig,
    wallet: Wallet
  ) {
    const blob = new Blob(file)
    const [tree, treeErr] = await blob.merkleTree()
    if (treeErr !== null) {
      throw new Error(`Error generating Merkle tree: ${treeErr}`)
    }
    const totalChunks = blob.numChunks()
    const rootHash = tree?.rootHash()
    const encodedAbiPrameters = MetaLayerClient.encodeOGFileCtx(ctx)
    try {
      if (await this.isOnchainAwareCtx(rootHash, network, wallet)) {
        throw new Error('File and RootHash already exist')
        return
      }
      const [tx, uploadErr] = await indexer.upload(blob, network.rpcUrl, wallet)

      if (uploadErr !== null) {
        throw new Error(`Upload error: ${uploadErr}`)
      }
      console.log('Upload successful! Transaction:', tx)

      await this.makeOnchainAwareCtx(rootHash, encodedAbiPrameters, network, wallet)

      return { rootHash, txHash: tx, totalChunks }
    } catch (e) {
      console.error('Upload failed:', e)
      return { rootHash, totalChunks, txHash: null, error: (e as Error).message }
    }
  }

  // isOnchainAwareCtx (moved into class, logic unchanged)
  async isOnchainAwareCtx(rootHash: string | null | undefined, network: NetworkConfig, wallet: Wallet) {
    if (!rootHash || rootHash?.length < 2) {
      throw new Error('isOnchainAwareCtx: rootHash is required but was null or undefined')
    }
    if (!network?.metaLayerAddress) {
      throw new Error('isOnchainAwareCtx: network.metaLayerAddress is missing')
    }
    const abi = ['function exists(bytes32 rootHash) view returns (bool)']
    const contract = new ethers.Contract(network?.metaLayerAddress, abi, wallet)
    try {
      const ex: boolean = await contract.exists(rootHash)
      return Boolean(ex)
    } catch (e) {
      console.warn('isOnchainAwareCtx read failed:', e)
      return false
    }
  }

  async getOnchainAwareCtx(rootHash: string | null | undefined, network: NetworkConfig, wallet: Wallet) {
    if (!rootHash || rootHash?.length < 2) {
      throw new Error('isOnchainAwareCtx: rootHash is required but was null or undefined')
    }
    if (!network?.metaLayerAddress) {
      throw new Error("getOnchainAwareCtx: network.metaLayerAddress is missing");
    }
      const abi = ["function getCtx(bytes32 rootHash) view returns (bytes)"]
      const contract = new ethers.Contract(network?.metaLayerAddress, abi, wallet)
    try {
      const data: string = await contract.getCtx(rootHash);
      if (!data || data === "0x") {
        console.warn("getOnchainAwareCtx: no context found for rootHash", rootHash);
        return null;
      }
      return data as `0x${string}`;
    } catch (e) {
      console.warn("getOnchainAwareCtx read failed:", e);
      return null;
    }
  }

  // makeOnchainAwareCtx (moved into class, logic unchanged)
  async makeOnchainAwareCtx(
    rootHash: string | null | undefined,
    ctxEncoded: `0x${string}`,
    network: NetworkConfig,
    wallet: Wallet
  ) {
    const abi = ['function createCtx(bytes32 rootHash, bytes calldata encodedCtx) payable']
    const contract = new ethers.Contract(network?.metaLayerAddress, abi, wallet)
    try {
      const tx = await contract.createCtx(rootHash, ctxEncoded, { value: ethers.parseEther('0.0001') })
      await tx.wait()
      console.log('ctx created:', tx.hash)
    } catch (e) {
      console.warn('makeOnchainAwareCtx write failed:', e)
      return
    }
  }

  // 4️⃣ Decode (kept same logic)
  decodeOGFileCtx(encoded: `0x${string}`) {
    const [ fileType, extension, dateAdded, encrypted, creator] = decodeAbiParameters(
      OG_FILE_CTX_TYPES,
      encoded
    )
    return {
      fileType,
      extension,
      dateAdded,
      encrypted,
      creator,
    }
  }
}

export default MetaLayerClient