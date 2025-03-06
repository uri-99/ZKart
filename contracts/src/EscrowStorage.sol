// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;

abstract contract EscrowStorage {

    enum OrderStatus {
        AVAILABLE,
        CANCELLED,
        WITHDRAWN,
        RESERVED,
        COMPLETED
    }

    struct BuyOrder {
        string itemUrl;
        uint256 price;
        address token;
        OrderStatus status;
        uint256 unlockBlockTime;
        address reserver;
        uint256 reservePayment;
    }

    struct OrderId {
        address buyer;
        uint256 nonce;
    }

    mapping(address => uint256) public userNonce;

    mapping(bytes32 => BuyOrder) public buyOrders; // keccak256(OrderId) => BuyOrder

    address public alignedServiceManager;
    address public paymentServiceAddr;

    bytes32 public elfCommitment; // elf commitment of the ZKEmail protocol

    uint256 public constant UNLOCK_BLOCK_TIME = 7 days;

    uint256 public constant RESERVE_FEE = 5; // 5% of the order price
    uint256 public constant RESERVE_BLOCK_TIME = 7 days;

    // storage gap for upgradeability
    // solhint-disable-next-line var-name-mixedcase
    uint256[24] private __GAP;
}
