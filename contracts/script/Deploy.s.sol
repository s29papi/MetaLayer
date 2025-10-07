// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;


import "forge-std/Script.sol";
import "../src/Metalayer.sol";

contract Deploy is Script {
    function run() external {
        // 🔐 load deployer private key from environment
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address owner = vm.envAddress("OWNER");

        // 🧮 convert 0.0001 ETH to wei
        uint256 createFee = 0.0001 ether;

        vm.startBroadcast(deployerKey);

        // 🚀 deploy the contract
        MetaLayerOnchain metaLayer = new MetaLayerOnchain(owner, createFee);

        console.log("MetaLayerOnchain deployed at:", address(metaLayer));
        console.log("Owner:", owner);
        console.log("Creator fee (wei):", createFee);

        vm.stopBroadcast();
    }
}
