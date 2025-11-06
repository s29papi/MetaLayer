
# 🧱 MetaLayer SDK

Verifiable Onchain Metadata for 0G Storage  
Store, verify, and fetch file contexts directly from the blockchain.

![npm version](https://img.shields.io/npm/v/@searchboxlabs/metalayer)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![0G Network](https://img.shields.io/badge/powered%20by-0G-blue)

## Proof of Mainnet Storage and Metadata context mapping on mainnet:
```
First selected node status : {
  connectedPeers: 38,
  logSyncHeight: 11763674,
  logSyncBlock: '0x2d3f07c2a54fab21f7fd1ecd89e2c46ba2e558092ff149cc8703cb5d673e2c92',
  nextTxSeq: 7333,
  networkIdentity: {
    chainId: 16661,
    flowAddress: '0x62d4144db0f0a6fbbaeb6296c785c71b3d57c526',
    p2pProtocolVersion: { major: 0, minor: 4, build: 0 }
  }
}
Selected nodes: [
  StorageNode {
    url: 'http://218.94.159.101:30275',
    timeout: 30000,
    retry: 3
  }
]
Data prepared to upload root=0xda5255f73287096e526638ea0ebc036c5a52d5fbd73c56a20e795e78e7a22735 size=96 numSegments=1 numChunks=1
Attempting to find existing file info by root hash...
Found existing file info: {
  tx: {
    streamIds: [],
    data: [],
    dataMerkleRoot: '0xda5255f73287096e526638ea0ebc036c5a52d5fbd73c56a20e795e78e7a22735',
    merkleNodes: [ [Array] ],
    startEntryIndex: 64141312,
    size: 96,
    seq: 7331
  },
  finalized: true,
  isCached: false,
  uploadedSegNum: 1,
  pruned: false
}
Submitting transaction with storage fee: 30733644962n
Sending transaction with gas price 4000000007
Transaction hash: 🔗 [Chainscan Hash](https://chainscan.0g.ai/tx/0x77344b9597b2dc37785b430334af5ed3221a41a4e8051fc0cbc2469447265856) 
Transaction sequence number: 7333
Wait for log entry on storage node
File already exists on node http://218.94.159.101:30275 {
  tx: {
    streamIds: [],
    data: [],
    dataMerkleRoot: '0xda5255f73287096e526638ea0ebc036c5a52d5fbd73c56a20e795e78e7a22735',
    merkleNodes: [ [Array] ],
    startEntryIndex: 64141312,
    size: 96,
    seq: 7331
  },
  finalized: true,
  isCached: false,
  uploadedSegNum: 1,
  pruned: false
}
Upload successful! Transaction: {
  txHash: '0x77344b9597b2dc37785b430334af5ed3221a41a4e8051fc0cbc2469447265856',
  rootHash: '0xda5255f73287096e526638ea0ebc036c5a52d5fbd73c56a20e795e78e7a22735'
}
ctx created: 0xcb9413367068d7cd1e5697fad426e18dbd3bbcc7891ca5429b1d0712ab7a3a7f
96
ArrayBuffer {
  [Uint8Contents]: <54 68 69 73 20 69 73 20 61 20 74 65 73 74 20 64 61 74 61 73 65 74 20 66 6f 72 20 52 41 47 62 69 74 73 20 45 78 63 68 61 6e 67 65 2e 20 49 74 20 63 6f 6e 74 61 69 6e 73 20 73 61 6d 70 6c 65 20 64 61 74 61 2e 20 6f 70 6f 70 20 6f 69 6f 70 20 66 66 66 66 66 61 20 61 73 61 73 73 20 61 73 61>,
  byteLength: 96
}
ctx: {
  version: 1,
  fileType: 'text/plain',
  extension: '.txt',
  category: 'document',
  dateAdded: 1762428270671n,
  encrypted: false,
  creator: '0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10'
}

```

---

## 🌐 Overview

**MetaLayer** provides a lightweight SDK for working with onchain-aware metadata stored on the **0G Storage Network**.

It enables:
- Seamless uploading of files with verifiable Merkle roots.
- Storing & retrieving contextual metadata onchain.
- Integration with decentralized indexers.
- Easy browser & backend usage.

---

## ⚙️ Installation

```bash
npm install @searchboxlabs/metalayer@1.0.6
````

or with Yarn:

```bash
yarn add @searchboxlabs/metalayer@1.0.6
```

---

## 🚀 Quick Start

```ts
import MetaLayerClient from "@metalayer/metalayer";
import { NETWORKS } from "@metalayer/metalayer/dist/network";
import { Blob, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import fs from "fs/promises";

async function main() {
  const client = new MetaLayerClient();
  const indexer = new Indexer(NETWORKS.testnet.indexerUrl);

  const ctx = {
    fileType: "text",
    extension: ".txt",
    dateAdded: BigInt(Date.now()),
    encrypted: false,
    creator: "0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10"
  };

  const buffer = await fs.readFile("./test.txt");
  const file = {
    size: buffer.length,
    slice: (start: number, end: number) => ({
      arrayBuffer: async () => buffer.slice(start, end).buffer,
    }),
  };

  const provider = new ethers.JsonRpcProvider(NETWORKS.testnet.rpcUrl);
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);

  await client.uploadWithCtx(indexer, ctx, file, NETWORKS.testnet, signer);

  const blob = new Blob(file);
  const [tree] = await blob.merkleTree();
  const rootHash = tree?.rootHash();

  const encodedCtx = await client.getOnchainAwareCtx(rootHash, NETWORKS.testnet, signer);
  console.log(client.decodeOGFileCtx(encodedCtx));
}

main();
```

---

## 🧩 Smart Contract

The onchain contract powering MetaLayer lives here:
🔗 [MetaLayer.sol](https://github.com/s29papi/MetaLayer/blob/main/contracts/src/Metalayer.sol)

It defines:

* `getCtx(bytes32 rootHash) view returns (bytes)`
* `storeCtx(bytes32 rootHash, bytes memory ctx)`

This allows verified metadata retrieval from smart contracts or external SDKs.

---

## 🔗 Integration Example

You can see an example integration using this SDK here:
📂 [MetaLayer Integration Code](https://github.com/s29papi/MetaLayer/tree/main/src)

---


## 🧠 Network Configuration

```ts
export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: 'testnet',
    rpcUrl: 'https://evmrpc-testnet.0g.ai/',       // <- change if you have a different RPC
    indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai/', // <- change to the real indexer endpoint
    explorerUrl: 'https://chainscan-galileo.0g.ai/',
    chainId: 16602,
    metaLayerAddress: `0x${"3Ca8B5e3fCD85c9960C3F8c09f0cbe6145ccdC27"}`
  },
  mainnet: {
    name: 'mainnet',
    rpcUrl: 'https://evmrpc.0g.ai/',       // <- change if you have a different RPC
    indexerUrl: 'https://indexer-storage-turbo.0g.ai/', // <- change to the real indexer endpoint
    explorerUrl: 'https://chainscan.0g.ai/',
    chainId: 16661,
    metaLayerAddress: `0x${"0xd15f8fc862d29b19d8f614c4aceb727f67986677"}`
  },
};
```

---

## 🛠️ Development

To build from source:

```bash
git clone https://github.com/s29papi/MetaLayer.git
cd MetaLayer
npm install
npm run build
```

The compiled SDK will appear under:

```
dist/
```

---

## 🤝 Contributing

Pull requests and ideas are welcome!
Please open an issue before submitting large changes.

---

## 🪪 License

This project is licensed under the **ISC License**.
See [LICENSE](./LICENSE) for details.

---
