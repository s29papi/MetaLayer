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