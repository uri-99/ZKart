// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import "forge-std/Script.sol";
import "../src/PaymentRegistry.sol";

contract Deploy is Script {
    PaymentRegistry public paymentRegistry;

    function setUp() public {}

    function run(
        string memory outputPath
    ) public {
        require(bytes(outputPath).length > 0, "Output path cannot be empty");

        vm.startBroadcast();

        // Deploy the contract
        paymentRegistry = new PaymentRegistry(
            address(0),
            address(0),
            bytes32(0)
        );

        console.log("PaymentRegistry deployed to:", address(paymentRegistry));

        vm.stopBroadcast();

        //write output
        _writeOutput(outputPath);
    }

    function _writeOutput(string memory outputPath) internal {
        string memory deployed_addresses = "addresses";
        
        vm.serializeAddress(
            deployed_addresses,
            "paymentRegistry",
            address(paymentRegistry)
        );

        // Add timestamp and network info
        vm.serializeString(
            deployed_addresses,
            "deploymentTimestamp",
            vm.toString(block.timestamp)
        );
        
        vm.writeJson(
            vm.serializeString(deployed_addresses, "network", "anvil"),
            outputPath
        );
    }
}

