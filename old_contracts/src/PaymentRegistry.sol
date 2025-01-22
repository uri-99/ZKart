// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

import {PaymentRegistryStorage} from "./PaymentRegistryStorage.sol";
// import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract PaymentRegistry is PaymentRegistryStorage {

    // Event emitted when a payment is recorded
    event PaymentReceived(address indexed user, uint256 amount);

    // Event emitted when a new order is created
    event OrderCreated(address indexed user, uint256 orderNonce, uint256 price, string itemUrl, bytes32 orderId);

    // Event emitted when an order is cancelled
    event OrderCancelled(address indexed user, bytes32 indexed orderId);

    // Event emitted when an order is withdrawn
    event OrderWithdrawn(address indexed user, bytes32 indexed orderId);

    // Event emitted when an order is completed
    event OrderCompleted(address indexed user, bytes32 indexed orderId);

    // Event emitted when an order is reserved
    event OrderReserved(bytes32 indexed orderId);

    // Event emitted when an order is cleared
    event OrderCleared(bytes32 indexed orderId);


    constructor(
        address _alignedServiceManager,
        address _paymentServiceAddr,
        bytes32 _elfCommitment
    ) {
        alignedServiceManager = _alignedServiceManager;
        paymentServiceAddr = _paymentServiceAddr;
        elfCommitment = _elfCommitment;
    }

    function newOrder(string calldata itemUrl, uint256 price, address token) external payable {
        if (token == address(0)) {
            require(msg.value == price, "Incorrect amount of funds received");
            _registerFunds();
        } else {
            require(msg.value == 0, "Incorrect amount of funds received");
            // require(IERC20(token).transferFrom(msg.sender, address(this), price), "Transfer failed");
        }

        uint256 userNonce = userState[msg.sender].nonce;
        bytes32 orderId = keccak256(abi.encode(OrderId(msg.sender, userNonce)));

        buyOrders[orderId] = BuyOrder(itemUrl, price, token, OrderStatus.AVAILABLE, type(uint256).max, address(0), 0);

        userState[msg.sender].nonce++;

        emit OrderCreated(msg.sender, userNonce, price, itemUrl, orderId);
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

        require(userState[msg.sender].userFunds >= order.price, "Insufficient funds"); // This should never happen
        userState[msg.sender].userFunds -= order.price;
        payable(msg.sender).transfer(order.price);

        order.status = OrderStatus.WITHDRAWN;
        emit OrderWithdrawn(msg.sender, orderId);
    }

    // In a P2P environment we will need a `reserveOrder()`
    // To avoid multiple users fulfilling the same order
    // This also serves incentive for users to place orders
    function reserveOrder(bytes32 orderId) external payable {
        BuyOrder memory order = buyOrders[orderId];
        require(order.status == OrderStatus.AVAILABLE, "Order is not available");
        require(msg.value >= order.price * RESERVE_FEE / 100, "at least RESERVE_FEE % deposit needed to reserve an order");
        
        order.status = OrderStatus.RESERVED;
        order.reserver = msg.sender;
        order.reservePayment = msg.value;
        
        emit OrderReserved(orderId);
    }
    function clearReservation(bytes32 orderId) external {
        BuyOrder memory order = buyOrders[orderId];
        require(order.status == OrderStatus.RESERVED, "Order is not reserved");
        require(order.unlockBlockTime < block.timestamp, "Order is not ready to be cleared");
        
        order.status = OrderStatus.AVAILABLE;
        // order.reserver = address(0); //maybe clear to save gas
        // order.reservePayment = 0;
        payable(msg.sender).transfer(order.reservePayment);

        emit OrderCleared(orderId);
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

        verifyZKEmailValidity(proofCommitment, pubInputCommitment, provingSystemAuxDataCommitment, proofGeneratorAddr, batchMerkleRoot, merkleProof, verificationDataBatchIndex);
        
        _withdraw(user, amount, order.reservePayment);


        order.status = OrderStatus.COMPLETED;

        emit OrderCompleted(user, orderId);
    }

    function _withdraw(address user, uint256 amount, uint256 reservePayment) internal {
        require(userState[user].userFunds >= amount, "User has insufficient funds"); // This should never happen , we should also consider handling this error another way
        userState[user].userFunds -= amount;
        payable(msg.sender).transfer(amount + reservePayment);
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

    function _registerFunds() internal {
        require(msg.value > 0, "No funds added");
        userState[msg.sender].userFunds += msg.value;
        emit PaymentReceived(msg.sender, msg.value);
    }
}

