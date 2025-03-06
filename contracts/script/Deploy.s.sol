// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/Escrow.sol";

contract Deploy is Script {
    Escrow public escrow;

    function setUp() public {}

    function run(
        string memory outputPath
    ) public {
        require(bytes(outputPath).length > 0, "Output path cannot be empty");

        vm.startBroadcast();

        // Deploy the contract
        escrow = new Escrow(
            address(0),
            address(0),
            bytes32(0)
        );

        console.log("Escrow deployed to:", address(escrow));

        vm.stopBroadcast();

        //write output
        _writeOutput(outputPath);
    }

    function _writeOutput(string memory outputPath) internal {
        string memory deployed_addresses = "addresses";
        
        vm.serializeAddress(
            deployed_addresses,
            "escrow",
            address(escrow)
        );

        // Add timestamp
        vm.serializeString(
            deployed_addresses,
            "deploymentTimestamp",
            vm.toString(block.timestamp)
        );
        
        vm.writeJson(
            vm.serializeString(deployed_addresses, "blockNumber", vm.toString(block.number)),
            outputPath
        );
    }
}

