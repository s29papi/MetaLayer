import MetaLayerClient from "../src/metalayer";
import { NETWORKS } from "../src/network";
import { OGFileCtx } from "../src/consts";
import { Blob } from '@0glabs/0g-ts-sdk';

import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import dotenv from 'dotenv';
dotenv.config();
import fs from 'fs/promises';
import { ethers } from 'ethers';
import { Indexer } from "@0glabs/0g-ts-sdk";
import type { SigningKey} from 'ethers';
import {detectFileCtxFromName, validateOGFileCtx} from "../src/utils"


const client = new MetaLayerClient()

// store ctx onchain store 
async function main() {
    const indexer = new Indexer(NETWORKS.testnet.indexerUrl)

    const ctx = detectFileCtxFromName("../test.txt", "0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10");
    const buffer = await fs.readFile('./test.txt');
    const file: any = {
      size: buffer.length,
      slice: (start: number, end: number) => ({
        arrayBuffer: async () => {
          // ensure start/end within bounds
          const s = Math.max(0, start | 0);
          const e = Math.min(buffer.length, end | 0);

          // Option A: use the underlying ArrayBuffer slice based on byteOffset/length
          const view = buffer.slice(s, e);
          const ab = view.buffer.slice(view.byteOffset, view.byteOffset + view.length);
          return ab;
        }
      })
};

    const provider = new ethers.JsonRpcProvider(NETWORKS.testnet.rpcUrl);

    const privateKey: any = process.env.PRIVATE_KEY;
  
    const signer = new ethers.Wallet(privateKey, provider); 

    await client.uploadWithCtx(indexer, ctx, file, NETWORKS.testnet, signer)
    const blob = new Blob(file)
    const [tree, treeErr] = await blob.merkleTree()
    if (treeErr !== null) {
      throw new Error(`Error generating Merkle tree: ${treeErr}`)
    }
    const totalChunks = blob.numChunks()
    const rootHash = tree?.rootHash()
    const encodedCtx: any = await client.getOnchainAwareCtx(rootHash, NETWORKS.testnet, signer)
    console.log(client.decodeOGFileCtx(encodedCtx))

    
    console.log(rootHash)
}

main()



