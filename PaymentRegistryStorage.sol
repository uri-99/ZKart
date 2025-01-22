pragma solidity ^0.8.12;

abstract contract PaymentRegistryStorage {
    struct BuyOrder {
        string itemUrl;
        uint256 price;
        bool isAvailable; // TODO: make an enum
        uint256 unlockBlockTime;
    }

    struct OrderId {
        address buyer;
        uint256 nonce;
    }

    struct UserState {
        uint256 userFunds;
        uint256 nonce; // Increments by 1 for each new order
    }


    mapping(address => UserState) public userState; // address => UserState


    mapping(uint256 => BuyOrder) public buyOrders; // keccak256(OrderId) => BuyOrder

    address public alignedServiceManager;
    address public paymentServiceAddr;

    bytes32 public elfCommitment; // elf commitment of the ZKEmail protocol

    uint256 public constant UNLOCK_BLOCK_TIME = 7 days;

    

    // storage gap for upgradeability
    // solhint-disable-next-line var-name-mixedcase
    uint256[24] private __GAP;
}
