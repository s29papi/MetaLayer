"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OG_FILE_CTX_TYPES = void 0;
// 2️⃣ Canonical ABI parameter layout (must match Solidity struct order)
exports.OG_FILE_CTX_TYPES = [
    // { name: 'rootHash', type: 'bytes32' },
    { name: 'fileType', type: 'string' },
    { name: 'extension', type: 'string' },
    { name: 'dateAdded', type: 'uint256' },
    { name: 'encrypted', type: 'bool' },
    { name: 'creator', type: 'address' },
];
