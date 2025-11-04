
# 🧱 MetaLayer SDK

 Verifiable Onchain Metadata for 0G Storage  
Store, verify, and fetch file contexts directly from the blockchain.

![npm version](https://img.shields.io/npm/v/@searchboxlabs/metalayer)
![Build](https://img.shields.io/badge/build-passing-brightgreen)
![0G Network](https://img.shields.io/badge/powered%20by-0G-blue)

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
