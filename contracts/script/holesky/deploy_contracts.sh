#!/bin/bash

# cd to the directory of this script so that this can be run from anywhere
parent_path=$( cd "$(dirname "${BASH_SOURCE[0]}")" ; pwd -P )
cd "$parent_path"
# At this point we are in contracts/script/holesky


cd ../../
pwd

# Ensure the output directory exists
mkdir -p ./script/output/holesky

# Deploy the contract
forge script script/Deploy.s.sol \
    --sig "run(string memory outputPath)" \
    ./script/output/holesky/deployment_output.json \
    --rpc-url $HOLESKY_RPC_URL \
    --private-key $HOLESKY_PRIVATE_KEY \
    --verify \
    --etherscan-api-key $HOLESKY_ETHERSCAN_API_KEY \
    --broadcast
