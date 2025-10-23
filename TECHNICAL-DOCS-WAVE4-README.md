# 🧠 MetaLayer — Wave 4

| **SDK Utility** | [`src/utils/`](https://github.com/s29papi/MetaLayer/tree/main/src/utils) — Utility functions for file-type inference, MIME detection, and contextual retrieval. |

| **SDK Constants** | [`src/const/`](https://github.com/s29papi/MetaLayer/tree/main/src/const) — Core metadata schemas, versioning logic, and standardized context definitions used across the SDK. |

**Project:** Verifiable Metadata Middleware for 0G Storage.

After building the first fully functional metadata middleware in Wave 3, we spoke directly with developers using 0G Storage.
Two pain points came up repeatedly:

1️⃣ Retrieval without known file type or extension

Developers wanted a way to recover files using only the root hash — without having to remember or manually specify the MIME type or extension.

2️⃣ Suggestive MIME typing during upload

When uploading, users found it tedious or error-prone to manually specify file types. They asked for auto-detection and autocomplete suggestions for MIME types and extensions inside the SDK.

MetaLayer Wave 4 directly addresses these needs by making the SDK smarter, not heavier — improving discoverability, automation, and developer experience while keeping everything verifiable and on-chain.

### **Project Overview**

## ⚙️ Installation

```bash
npm install @searchboxlabs/metalayer@1.0.2
````

or with Yarn:

```bash
yarn add @searchboxlabs/metalayer@1.0.2
```

**Repository:** [github.com/s29papi/MetaLayer](https://github.com/s29papi/MetaLayer)

* **Contract Address:** `0x3Ca8B5e3fCD85c9960C3F8c09f0cbe6145ccdC27`
* **Creator Tip:** `0.0001 ETH`
* **Chain:** EVM-compatible 0G testnet

| **Smart Contract**  | [`Metalayer.sol`](https://github.com/s29papi/MetaLayer/blob/main/contracts/src/Metalayer.sol) — On-chain registry storing metadata bytes keyed by file Merkle roots. |


| **SDK Integration** | [`src/`](https://github.com/s29papi/MetaLayer/tree/main/src) — TypeScript SDK 


---

## **Why Wave 4 Matters**

Wave 3 established verifiable metadata anchoring.
Wave 4 closes the loop by making **retrieval self-descriptive** — anyone with a `rootHash` can now recover the file in full fidelity and correct format, directly from 0G Storage, without external references.

This makes datasets:

* Easier to verify and reuse
* Easier to publish with consistent metadata evolution
* Easier to integrate into decentralized indexing and search tools

---

## **Wave 4 Architecture**

| **Component**                      | **Functionality**                                                                                     |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 🧱 **MetaLayer Smart Contract**    | Unchanged base from Wave 3 — continues to store ABI-encoded metadata under unique Merkle root hashes. |
| 💾 **0G Indexer**                  | Handles full-file retrieval from the network.                                                         |
| ⚙️ **MetaLayerClient v2 (Wave 4)** | Adds versioned metadata, file-type inference, and enhanced retrieval.                                 |
| 🧩 **Metadata Registry**           | Supports custom metadata (`version 0`) alongside system metadata (`version 1+`).                      |

---

## **Wave 4 SDK Workflow**

### **Upload with Versioned Metadata**

```ts
{
  version: 1,
  fileType: 'application/pdf',
  extension: '.pdf',
  dateAdded: 1760253000000n,
  encrypted: false,
  creator: '0x330cA32b71b81Ea2b1D3a5C391C5cFB6520E0A10'
}
```

### **Commit On-Chain**

```ts
await client.createCtx(rootHash, encodedMetadata, { value: parseEther("0.0001") })
```

### **Retrieve and Reconstruct**

```ts
const file = await client.retrieveWithCtx(rootHash)
console.log(file.ext) // → '.pdf'
```

### **Verification**

Compare the re-downloaded file’s Merkle Root with the on-chain `rootHash` for proof of integrity.

---

## **Wave 4 Summary**

| **Area**             | **Wave 3**         | **Wave 4**                           |
| -------------------- | ------------------ | ------------------------------------ |
| **Metadata Storage** | On-chain anchoring | Versioned metadata (custom + system) |
| **Retrieval**        | Requires file info | RootHash-only, file-type inference   |
| **SDK**              | Base client        | Context-aware client                 |
| **Verification**     | Manual             | Automated integrity check            |
| **Usability**        | Developer-facing   | End-user retrievable                 |

---

### **Demo Example - RETRIEVAL**

```ts
import {retrieveAndAssignFileType} from "../src/utils"
import { Indexer } from "@0glabs/0g-ts-sdk";
import { NETWORKS } from "../src/network";

async function main() {
    const indexer = new Indexer(NETWORKS.testnet.indexerUrl)
    const rootHash = '0xda5255f73287096e526638ea0ebc036c5a52d5fbd73c56a20e795e78e7a22735'
    const loc = await retrieveAndAssignFileType(indexer, rootHash)
    console.log(loc)
}

main()

```


---
### **Demo Example - STORAGE**

```ts
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


```

---

### **Wave 4 Deliverables**

* **MetaLayerClient SDK v2**
  * Added metadata **versioning** (custom v0, system v1+)
  * Implemented **file-type inference** and **MIME detection** for retrieved datasets
  * Introduced **contextual retrieval** via `retrieveWithCtx(rootHash)`
  * Enhanced **error handling** and **duplicate prevention** during uploads

* **Smart Contract**
  * Maintains ABI-compliant metadata registry
  * Supports **versioned metadata contexts**
  * Enables seamless verification of rootHash–metadata integrity

* **SDK Utilities & Constants**
  * | **SDK Utility** | [`src/utils/`](https://github.com/s29papi/MetaLayer/tree/main/src/utils) — Utility functions for file-type inference, MIME detection, and contextual retrieval. |

  * | **SDK Constants** | [`src/const/`](https://github.com/s29papi/MetaLayer/tree/main/src/const) — Core metadata schemas, versioning logic, and standardized context definitions used across the SDK. |

* **Network Integration**
  * Fully deployed and tested on the **0G testnet**
  * Verified **end-to-end retrieval** by rootHash with auto MIME inference

* **End-to-End Flow**
  * Complete pipeline: **upload → on-chain commit → rootHash-based retrieval → verification**


