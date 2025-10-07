// 1️⃣ Define your metadata structure
export interface OGFileCtx {
  // rootHash: string      // bytes32
  fileType: string      // string
  extension: string     // string
  dateAdded: bigint     // uint256 (BigInt required by viem)
  encrypted: boolean    // bool
  creator: string       // address
}


// 2️⃣ Canonical ABI parameter layout (must match Solidity struct order)
export const OG_FILE_CTX_TYPES = [
  // { name: 'rootHash', type: 'bytes32' },
  { name: 'fileType', type: 'string' },
  { name: 'extension', type: 'string' },
  { name: 'dateAdded', type: 'uint256' },
  { name: 'encrypted', type: 'bool' },
  { name: 'creator', type: 'address' },
]
