// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

/// @title MetaLayerOnchain
/// @notice Minimal contract to map 0G rootHash => encoded metadata bytes (OG_FILE_CTX)
/// - Stores bytes (ABI-encoded) off-chain tooling decodes with the agreed ABI tuple.
/// - Supports creation, deletion, read, ownership and optional write fee.
/// - Emits events for indexing / audit.
contract MetaLayerOnchain {
    /// Owner (multisig or deployer) can withdraw fees and set parameters.
    address public owner;

    /// Optional fee (in wei) required to create a ctx entry. Set to 0 to disable.
    uint256 public createFee;

    /// Mapping from rootHash (bytes32) -> encoded metadata bytes
    mapping(bytes32 => bytes) private ctxStore;

    /// Track existence to save gas when returning empty bytes (helps clarity)
    mapping(bytes32 => bool) public exists;

    /// Events
    event CtxCreated(bytes32 indexed rootHash, address indexed createdBy, uint256 timestamp);
    event CtxDeleted(bytes32 indexed rootHash, address indexed deletedBy, uint256 timestamp);
    event CreateFeeUpdated(uint256 newFee);

    /// Errors (cheaper than revert strings)
    error AlreadyExists(bytes32 rootHash);
    error NotCreatorOrOwner(address caller);
    error NotExists(bytes32 rootHash);
    error NotCreator(address caller);
    error InsufficientFee(uint256 required, uint256 sent);

    /// Creator mapping for access control: who created the entry
    mapping(bytes32 => address) public creatorOf;

    modifier onlyOwner() {
        require(msg.sender == owner, "owner only");
        _;
    }

    constructor(address _owner, uint256 _createFee) {
        require(_owner != address(0), "zero owner");
        owner = _owner;
        createFee = _createFee;
    }

    /// @notice Create a new mapping rootHash -> encoded metadata bytes
    /// @param rootHash bytes32 root hash returned by 0G (Merkle root)
    /// @param encodedCtx ABI-encoded bytes (e.g. encodeAbiParameters([...], [...]) from viem)
    function createCtx(bytes32 rootHash, bytes calldata encodedCtx) external payable {
        if (exists[rootHash]) revert AlreadyExists(rootHash);

        // Require fee if set
        if (createFee > 0 && msg.value < createFee) revert InsufficientFee(createFee, msg.value);

        // Store
        ctxStore[rootHash] = encodedCtx;
        exists[rootHash] = true;
        creatorOf[rootHash] = msg.sender;

        emit CtxCreated(rootHash, msg.sender, block.timestamp);
    }

    /// @notice Delete an existing mapping. Only the creator or contract owner may delete it.
    /// Emits CtxDeleted event. Note: data remains in history (logs), mapping entry cleared.
    function deleteCtx(bytes32 rootHash) external {
        if (!exists[rootHash]) revert NotExists(rootHash);
        address c = creatorOf[rootHash];
        if (msg.sender != c && msg.sender != owner) revert NotCreatorOrOwner(msg.sender);

        // Clear storage
        delete ctxStore[rootHash];
        delete exists[rootHash];
        delete creatorOf[rootHash];

        emit CtxDeleted(rootHash, msg.sender, block.timestamp);
    }

    /// @notice Read raw bytes for a rootHash. Returns empty bytes if not exists.
    /// Off-chain clients should check `exists[rootHash]` for presence before decoding.
    function getCtx(bytes32 rootHash) external view returns (bytes memory) {
        return ctxStore[rootHash];
    }

    /// @notice Read and decode helpers are intentionally not added on-chain (expensive).
    /// Off-chain code should call getCtx and decode via the agreed ABI tuple.

    /// ---------- Admin functions ----------
    /// @notice Owner can update the create fee (in wei).
    function setCreateFee(uint256 fee) external onlyOwner {
        createFee = fee;
        emit CreateFeeUpdated(fee);
    }

    /// @notice Owner can withdraw collected fees.
    function withdraw(address payable to) external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "no balance");
        to.transfer(bal);
    }

    /// @notice Transfer ownership (use multisig address as owner in production).
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero owner");
        owner = newOwner;
    }

    /// Fallbacks
    receive() external payable {}
    fallback() external payable {}
}
