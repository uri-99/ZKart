#!/bin/bash

# cd to the directory of this script so that this can be run from anywhere
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
# At this point we are in tests/integration
cd "$parent_path"

# Create output directory if it doesn't exist
mkdir -p ../../script/output/devnet

# Kill any existing anvil instances
pkill -f anvil || true
sleep 1


# Start anvil with deterministic setup, and dump its state to a json file upon exit
anvil \
    --dump-state state/deployed-anvil-state.json \
    --block-time 1 \
    &

cd ../../
sleep 2

# Ensure the output directory exists
mkdir -p ./script/output/devnet

# Deploy the contract
forge script script/Deploy.s.sol \
    --sig "run(string memory outputPath)" \
    ./script/output/devnet/deployment_output.json \
    --rpc-url "http://localhost:8545" \
    --private-key "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" \
    --broadcast

# Kill the anvil process gracefully to save state
pkill -f anvil || true
