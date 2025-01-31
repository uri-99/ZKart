// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {PaymentRegistryStorage} from "./PaymentRegistryStorage.sol";
import {IERC20} from "forge-std/interfaces/IERC20.sol";

contract PaymentRegistry is PaymentRegistryStorage {

    event PaymentReceived(address indexed user, uint256 amount, address token);
    event OrderCreated(address indexed user, uint256 orderNonce, uint256 price, string itemUrl, bytes32 orderId);
    event OrderCancelled(address indexed user, bytes32 indexed orderId);
    event OrderWithdrawn(address indexed user, bytes32 indexed orderId);
    event OrderCompleted(address indexed user, bytes32 indexed orderId);
    event OrderReserved(bytes32 indexed orderId);
    event OrderCleared(bytes32 indexed orderId);

    // TODO: implement ownable, so only we can call `cashOut()`
    // Anyhow, front-running is protected by the reservation flow, only the reserver can cashOut.

    constructor(
        address _alignedServiceManager,
        address _paymentServiceAddr,
        bytes32 _elfCommitment
    ) {
        alignedServiceManager = _alignedServiceManager;
        paymentServiceAddr = _paymentServiceAddr;
        elfCommitment = _elfCommitment;
    }

    function _receiveFunds(uint256 amount, address token) internal {
        if (token == address(0)) {
            require(msg.value > 0, "No funds added");
            require(msg.value == amount, "Incorrect amount of funds received");
            emit PaymentReceived(msg.sender, msg.value, address(0));
        } else {
            require(msg.value == 0, "Incorrect amount of funds received");
            emit PaymentReceived(msg.sender, amount, token);
            require(IERC20(token).transferFrom(msg.sender, address(this), amount), "Transfer failed");
        }
    }

    function _withdrawFunds(uint256 amount, address token) internal {
        if (token == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");
        }
    }

    function newOrder(string calldata itemUrl, uint256 price, address token) external payable {
        _receiveFunds(price, token);

        uint256 orderNonce = userNonce[msg.sender];
        bytes32 orderId = keccak256(abi.encode(OrderId(msg.sender, orderNonce)));

        buyOrders[orderId] = BuyOrder(itemUrl, price, token, OrderStatus.AVAILABLE, type(uint256).max, address(0), 0);

        userNonce[msg.sender]++;

        emit OrderCreated(msg.sender, orderNonce, price, itemUrl, orderId);
    }

    // Step #1 to cancel an order
    function cancelOrder(uint256 orderNonce) external {
        bytes32 orderId = keccak256(abi.encode(OrderId(msg.sender, orderNonce)));
        BuyOrder memory order = buyOrders[orderId];

        require(order.status == OrderStatus.AVAILABLE, "Order is not available");

        order.status = OrderStatus.CANCELLED;
        order.unlockBlockTime = block.timestamp + UNLOCK_BLOCK_TIME;

        emit OrderCancelled(msg.sender, orderId);
    }

    // Step #2 to cancel an order, only runnable after a lock period
    function withdrawOrder(uint256 orderNonce) external {
        bytes32 orderId = keccak256(abi.encode(OrderId(msg.sender, orderNonce)));
        BuyOrder memory order = buyOrders[orderId];

        require(block.timestamp >= order.unlockBlockTime, "Order is not ready to be withdrawn");
        require(order.status == OrderStatus.CANCELLED, "Order was not cancelled");

        order.status = OrderStatus.WITHDRAWN; // Acts as reentrancy guard
        emit OrderWithdrawn(msg.sender, orderId);

        _withdrawFunds(order.price, order.token);
    }

    // In a P2P environment we will need a `reserveOrder()`
    // To avoid multiple users fulfilling the same order
    // This also serves incentive for users to place orders
    function reserveOrder(bytes32 orderId) external payable {
        BuyOrder memory order = buyOrders[orderId];
        require(order.status == OrderStatus.AVAILABLE, "Order is not available");

        uint256 reservePaymentAmount = (order.price * RESERVE_FEE) / 100;
        order.status = OrderStatus.RESERVED;
        order.reserver = msg.sender;
        order.reservePayment = reservePaymentAmount;

        emit OrderReserved(orderId);
        
        _receiveFunds(reservePaymentAmount, order.token);
    }
    
    function clearReservation(bytes32 orderId) external {
        BuyOrder memory order = buyOrders[orderId];
        require(order.status == OrderStatus.RESERVED, "Order is not reserved");
        require(order.unlockBlockTime < block.timestamp, "Order is not ready to be cleared");
        
        order.status = OrderStatus.AVAILABLE; // Acts as reentrancy guard
        uint256 reservePaymentAmount = order.reservePayment;
        delete order.reserver;
        delete order.reservePayment;

        emit OrderCleared(orderId);

        _withdrawFunds(reservePaymentAmount, order.token);
    }

    function cashOut(
        address user,
        uint256 orderNonce,
        uint256 amount,
        string calldata itemUrl,
        bytes32 proofCommitment,
        bytes32 pubInputCommitment,
        bytes32 provingSystemAuxDataCommitment,
        bytes20 proofGeneratorAddr,
        bytes32 batchMerkleRoot,
        bytes memory merkleProof,
        uint256 verificationDataBatchIndex
    ) external {
        bytes32 orderId = keccak256(abi.encode(OrderId(user, orderNonce)));
        BuyOrder memory order = buyOrders[orderId];
        require(order.status == OrderStatus.RESERVED, "Order was not reserved");
        require(order.reserver == msg.sender, "You are not the reserver of this order");

        require(order.price == amount, "Incorrect amount of funds received");
        require(keccak256(abi.encode(order.itemUrl)) == keccak256(abi.encode(itemUrl)), "Incorrect item URL");

        order.status = OrderStatus.COMPLETED;
        emit OrderCompleted(user, orderId);

        verifyZKEmailValidity(proofCommitment, pubInputCommitment, provingSystemAuxDataCommitment, proofGeneratorAddr, batchMerkleRoot, merkleProof, verificationDataBatchIndex);
    
        _withdrawFunds(amount + order.reservePayment, order.token);
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
        require(provingSystemAuxDataCommitment == elfCommitment, "Invalid Elf");

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

    // Only way to add funds to this contract is via `newOrder()`
    // Only way to remove funds from this contract is via `cancelOrder()` or via `cashOut()`
    receive() external payable {
        require(false, "This contract does not accept funds");
    }
}



0x0000000000000000000000000000000000000000