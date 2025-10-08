# 🧠 MetaLayer — Wave 3

**Project:** Verifiable Metadata Middleware for 0G Storage.

### **Project Overview**

## ⚙️ Installation

```bash
npm install @searchboxlabs/metalayer@1.0.0
````

or with Yarn:

```bash
yarn add @searchboxlabs/metalayer@1.0.0
```

**Repository:** [github.com/s29papi/MetaLayer](https://github.com/s29papi/MetaLayer)

* **Contract Address:** `0x3Ca8B5e3fCD85c9960C3F8c09f0cbe6145ccdC27`
* **Creator Tip:** `0.0001 ETH`
* **Chain:** EVM-compatible 0G testnet

| **Smart Contract**  | [`Metalayer.sol`](https://github.com/s29papi/MetaLayer/blob/main/contracts/src/Metalayer.sol) — On-chain registry storing metadata bytes keyed by file Merkle roots. |


| **SDK Integration** | [`src/`](https://github.com/s29papi/MetaLayer/tree/main/src) — TypeScript SDK 



**MetaLayer** is a middleware layer built on top of **0G Storage** to provide **verifiable, on-chain metadata** for decentralized datasets. During Wave 3, we focused on bridging **off-chain datasets** and **on-chain metadata**, creating a trustless, monetized, and discoverable mapping between dataset root hashes and structured metadata.

**Key Achievements:**

* Developed a **TypeScript SDK (`MetaLayerClient`)** to handle encoding, uploading, and registering metadata.
* Anchored dataset metadata **on-chain** under unique Merkle root hashes.
* Enabled **on-chain queries** to retrieve structured metadata.
* Implemented a **small-tip payable mechanism** (`0.0001 ETH`) for committing metadata.
* Verified full **end-to-end workflow locally and on 0G testnet**.

---

### **Why MetaLayer Matters**

0G Storage provides decentralized hosting but lacks verifiable links between datasets and descriptive context.
MetaLayer solves this by:

* Anchoring **structured metadata** on-chain.
* Ensuring **trustless verification** of data provenance.
* Enabling **monetized access** and **discoverability** for datasets.
* Laying a foundation for **decentralized data markets** and **AI pipelines**.

---

### **Wave 3 Architecture**

| Component                       | Functionality                                                                      |
| ------------------------------- | ---------------------------------------------------------------------------------- |
| 🧱 **MetaLayer Smart Contract** | Stores ABI-encoded metadata mapped to Merkle root hashes.                          |
| 💾 **0G Indexer**               | Handles file uploads and Merkle tree computation.                                  |
| 🧠 **MetaLayerClient SDK**      | Encodes metadata, interacts with Indexer, and commits/retrieves on-chain metadata. |
| 💰 **Wallet (ethers.js)**       | Signs and submits transactions for metadata registration and queries.              |

---

### **Network & Contract Details**

**Testnet Config Used During Wave 3 Hack:**

```ts
export const NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    name: 'testnet',
    rpcUrl: 'https://evmrpc-testnet.0g.ai/',
    indexerUrl: 'https://indexer-storage-testnet-turbo.0g.ai/',
    explorerUrl: 'https://chainscan-galileo.0g.ai/',
    chainId: 16602,
    metaLayerAddress: '0x3Ca8B5e3fCD85c9960C3F8c09f0cbe6145ccdC27'
  }
}
```

* **Contract Address:** `0x3Ca8B5e3fCD85c9960C3F8c09f0cbe6145ccdC27`
* **Creator Tip:** `0.0001 ETH`
* **Chain:** EVM-compatible 0G testnet

---

### **SDK Workflow Achieved**

1. **Dataset Upload**

   * Compute **Merkle tree** of file.
   * Derive **root hash** of dataset.

2. **Metadata Encoding**

   * Structure metadata:

     ```ts
     {
       fileType: 'text',
       extension: '.txt',
       dateAdded: 1759854614432n,
       encrypted: false,
       creator: '0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10'
     }
     ```
   * Encode using **ABI parameters**.

3. **On-chain Commit**

   * Call `createCtx(rootHash, encodedMetadata)` with **0.0001 ETH tip**.

4. **On-chain Query**

   * Retrieve metadata via `getCtx(rootHash)` and decode it off-chain.

---

### **Demo Example**

```ts
import MetaLayerClient from "@/metalayer";
import { NETWORKS } from "@/network";
import { OGFileCtx } from "@/consts";
import { Blob, Indexer } from '@0glabs/0g-ts-sdk';
import { ethers } from 'ethers';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const client = new MetaLayerClient();

  // Initialize 0G Indexer
  const indexer = new Indexer(NETWORKS.testnet.indexerUrl);

  // Define metadata
  const ctx: OGFileCtx = {
    fileType: "text",      // Can be "image" | "video" | "audio"
    extension: ".txt",
    dateAdded: BigInt(Date.now()),
    encrypted: false,
    creator: "0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10"
  };

  // Read file into buffer
  const buffer = await fs.readFile('./test.txt');

  // Minimal File-like object for Blob
  const file: { size: number; slice: (start: number, end: number) => { arrayBuffer: () => Promise<ArrayBuffer> } } = {
    size: buffer.length,
    slice: (start, end) => ({
      arrayBuffer: async () => buffer.slice(start, end).buffer
    })
  };

  // Setup signer
  const provider = new ethers.JsonRpcProvider(NETWORKS.testnet.rpcUrl);
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("PRIVATE_KEY not set in .env");

  const signer = new ethers.Wallet(privateKey, provider);

  // Upload file & metadata
  const { rootHash, txHash, totalChunks, error } = await client.uploadWithCtx(
    indexer,
    ctx,
    file,
    NETWORKS.testnet,
    signer
  );

  if (error) {
    console.error("Upload failed:", error);
    return;
  }

  console.log(`Upload successful! RootHash: ${rootHash}, TxHash: ${txHash}, Chunks: ${totalChunks}`);

  // Generate Merkle tree for reference
  const blob = new Blob(file);
  const [tree, treeErr] = await blob.merkleTree();
  if (treeErr) throw new Error(`Error generating Merkle tree: ${treeErr}`);
  const total = blob.numChunks();
  const hash = tree?.rootHash();

  // Fetch on-chain metadata
  const encodedCtx = await client.getOnchainAwareCtx(hash, NETWORKS.testnet, signer);
  if (!encodedCtx) {
    console.warn("No metadata found on-chain for rootHash:", hash);
    return;
  }

  // Decode and display metadata
  const decoded = client.decodeOGFileCtx(encodedCtx);
  console.log("Decoded On-Chain Metadata:", decoded);
}

main().catch(console.error);

```

---

### **Wave 3 Deliverables**

* **MetaLayerClient SDK**

  * Encoding/decoding functions
  * Metadata upload
  * On-chain verification
* **Smart Contract**

  * ABI-compliant metadata registry
  * Supports `createCtx` and `getCtx` functions
* **Network Integration**

  * Fully tested on 0G testnet
* **End-to-End Flow**

  * Local & testnet testing of upload → commit → retrieval


