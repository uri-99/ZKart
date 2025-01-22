// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.12;

import {PaymentRegistryStorage} from "./PaymentRegistryStorage.sol";

contract PaymentRegistry is PaymentRegistryStorage {

    // Event emitted when a payment is recorded
    event PaymentReceived(address indexed user, uint256 amount);

    // Event emitted when a new order is created
    event OrderCreated(address indexed user, uint256 orderId, uint256 price, string itemUrl);


    constructor(
        address _alignedServiceManager,
        address _paymentServiceAddr,
        bytes32 _elfCommitment
    ) {
        alignedServiceManager = _alignedServiceManager;
        paymentServiceAddr = _paymentServiceAddr;
        elfCommitment = _elfCommitment;
    }

    function newOrder(address user, string calldata itemUrl, uint256 price) external payable {
        require(msg.value == price, "Incorrect amount of funds received");
        addFunds();

        uint256 userNonce = userState[user].nonce;
        buyOrders[keccak256(OrderId(user, userNonce))] = BuyOrder(itemUrl, price, true);
        emit OrderCreated(user, userNonce, price, itemUrl);
        
        userState[user].nonce++;
    }

    // Step #1 to cancel an order
    function cancelOrder(uint256 orderId) external {
        require(buyOrders[orderId].isAvailable, "Order is not available");
        buyOrders[orderId].isAvailable = false;
        buyOrders[orderId].unlockBlockTime = block.timestamp + UNLOCK_BLOCK_TIME;
    }

    // Step #2 to cancel an order, only runnable after a lock period
    function withdrawOrder(uint256 orderId) external {
        BuyOrder memory order = buyOrders[orderId];

        require(msg.sender == order.buyer, "You are not the buyer of this order");
        require(block.timestamp >= order.unlockBlockTime, "Order is not ready to be withdrawn");
        require(!order.isAvailable, "Order is not locked");

        require(userState[msg.sender] >= order.price, "Insufficient funds"); // This should never happen
        userState[msg.sender] -= order.amount;

        payable(msg.sender).transfer(order.amount);
    }

    function cashOut(
        address user,
        uint256 amount,
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) external {
        verifyZKEmailValidity(proofCommitment, pubInputCommitment, provingSystemAuxDataCommitment, proofGeneratorAddr, batchMerkleRoot, merkleProof, verificationDataBatchIndex);
        // withdraw(user, amount);
    }

    function verifyZKEmailValidity( //verifyBatchInclusion
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) public view {
        if (elfCommitment != provingSystemAuxDataCommitment) {
            revert InvalidElf(provingSystemAuxDataCommitment);
        }

        (
            bool callWasSuccessfull,
            bytes memory proofIsIncluded
        ) = alignedServiceManager.staticcall(
                abi.encodeWithSignature(
                    "verifyBatchInclusion(bytes32,bytes32,bytes32,bytes20,bytes32,bytes,uint256,address)",
                    proofCommitment,
                    pubInputCommitment,
                    provingSystemAuxDataCommitment,
                    proofGeneratorAddr,
                    batchMerkleRoot,
                    merkleProof,
                    verificationDataBatchIndex,
                    paymentServiceAddr
                )
            );

        require(callWasSuccessfull, "static_call of verifyBatchInclusion failed");
        require(abi.decode(proofIsIncluded, (bool)), "proof was not verified, or not included in the batch");
    }

        // Only way to add funds to this contract is via `newOrder`
    // Only way to remove funds from this contract is via `cancelOrder`
    receive() external payable {
        require(false, "This contract does not accept funds");
    }

    function addFunds() internal payable {
        require(msg.value > 0, "No funds added");
        userState[msg.sender].userFunds += msg.value;
        emit PaymentReceived(msg.sender, msg.value);
    }
}

