// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  Escrow.sol — TrustChain Escrow Contract
// ============================================================
//  This contract lets a BUYER lock ETH in escrow while a SELLER
//  delivers goods or services.  A third-party ARBITRATOR can
//  step in to resolve disputes.
//
//  Lifecycle of a transaction:
//    Created ➜ Delivered ➜ Completed   (happy path)
//    Created/Delivered ➜ Disputed ➜ Resolved/Refunded
// ============================================================

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Escrow is ReentrancyGuard {
    // -------------------------------------------------------
    //  Enums
    // -------------------------------------------------------

    /// @notice Every escrow transaction moves through these states.
    enum Status {
        Created,    // 0 — funds locked, waiting for delivery
        Delivered,  // 1 — seller says goods are delivered
        Completed,  // 2 — buyer confirmed, funds released ✓
        Disputed,   // 3 — either party raised a dispute 🚩
        Refunded    // 4 — dispute resolved in buyer's favour
    }

    // -------------------------------------------------------
    //  Data Structures
    // -------------------------------------------------------

    /// @notice All the information we store for one escrow deal.
    struct Transaction {
        address payable buyer;   // The person who locked the funds
        address payable seller;  // The person who will receive funds
        uint256 amount;          // How much ETH is locked (in wei)
        Status  status;          // Current state of the transaction
        uint256 createdAt;       // Block timestamp when created
        uint256 updatedAt;       // Block timestamp of last state change
    }

    // -------------------------------------------------------
    //  State Variables
    // -------------------------------------------------------

    /// @notice Address of the trusted arbitrator who resolves disputes.
    address public arbitrator;
    mapping(uint256 => uint256) public inspectionDays;
    uint256 public constant DELIVERY_TIMEOUT = 30 days;
    uint256 public constant DISPUTE_TIMEOUT = 30 days;

    /// @notice Auto-incrementing counter used to generate transaction IDs.
    uint256 public transactionCount;

    /// @notice Reference to the Reputation contract (set after deployment).
    address public reputationContract;

    /// @notice Maps a transaction ID to its Transaction struct.
    mapping(uint256 => Transaction) public transactions;

    /// @notice Tracks completed transactions between two addresses.
    ///         completedWith[buyer][seller] = true means they finished a deal.
    mapping(address => mapping(address => bool)) public completedWith;

    // -------------------------------------------------------
    //  Events  (emitted on every state change for off-chain tracking)
    // -------------------------------------------------------

    event TransactionCreated(
        uint256 indexed transactionId,
        address indexed buyer,
        address indexed seller,
        uint256 amount
    );

    event Delivered(uint256 indexed transactionId);

    event Completed(
        uint256 indexed transactionId,
        address indexed seller,
        uint256 amount
    );

    event Disputed(
        uint256 indexed transactionId,
        address indexed raisedBy
    );

    event Resolved(
        uint256 indexed transactionId,
        bool    releasedToSeller
    );

    // -------------------------------------------------------
    //  Modifiers  (reusable access-control checks)
    // -------------------------------------------------------

    /// @notice Only the arbitrator can call functions with this modifier.
    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Escrow: caller is not the arbitrator");
        _;
    }

    // -------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------

    /// @notice Deploys the Escrow contract.
    /// @param _arbitrator  Address that will resolve disputes.
    constructor(address _arbitrator) {
        require(_arbitrator != address(0), "Escrow: arbitrator cannot be zero address");
        arbitrator = _arbitrator;
    }

    // -------------------------------------------------------
    //  Admin Functions
    // -------------------------------------------------------

    /// @notice Links the Reputation contract so we can notify it on completions.
    ///         Can only be called once (to prevent tampering after setup).
    /// @param _reputationContract  Deployed Reputation contract address.
    function setReputationContract(address _reputationContract) external onlyArbitrator {
        require(reputationContract == address(0), "Escrow: reputation already set");
        require(_reputationContract != address(0), "Escrow: invalid address");
        reputationContract = _reputationContract;
    }

    // -------------------------------------------------------
    //  Core Functions
    // -------------------------------------------------------

    /// @notice Buyer creates a new escrow transaction by sending ETH.
    /// @param  _seller  Address of the seller who will fulfil the order.
    /// @return transactionId  The unique ID of the new transaction.
    function createTransaction(address payable _seller, uint256 daysToInspect)
        external
        payable
        returns (uint256 transactionId)
    {
        require(daysToInspect >= 1 && daysToInspect <= 30, "Invalid inspection period");
        // --- Validations ---
        require(msg.value > 0, "Escrow: must send ETH");
        require(_seller != address(0), "Escrow: seller cannot be zero address");
        require(_seller != msg.sender, "Escrow: buyer and seller cannot be the same");

        // --- Generate ID & store ---
        transactionId = transactionCount;       // Current count becomes the ID
        inspectionDays[transactionId] = daysToInspect;
        transactionCount++;                     // Increment for next time

        transactions[transactionId] = Transaction({
            buyer:     payable(msg.sender),
            seller:    _seller,
            amount:    msg.value,
            status:    Status.Created,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });

        emit TransactionCreated(transactionId, msg.sender, _seller, msg.value);
    }

    /// @notice Seller marks the order as delivered.
    ///         This does NOT release funds — the buyer must still confirm.
    /// @param _transactionId  ID of the transaction to update.
    function markDelivered(uint256 _transactionId) external {
        Transaction storage txn = transactions[_transactionId];

        // Only the seller can mark delivery
        require(msg.sender == txn.seller, "Escrow: only seller can mark delivered");
        // Must be in 'Created' state
        require(txn.status == Status.Created, "Escrow: invalid status for delivery");

        txn.status    = Status.Delivered;
        txn.updatedAt = block.timestamp;

        emit Delivered(_transactionId);
    }

    /// @notice Buyer confirms that the delivery is satisfactory.
    ///         This releases the escrowed funds to the seller.
    /// @param _transactionId  ID of the transaction to complete.
    function confirmCompletion(uint256 _transactionId) external nonReentrant {
        Transaction storage txn = transactions[_transactionId];

        // Only the buyer can confirm
        require(msg.sender == txn.buyer || (txn.status == Status.Delivered && block.timestamp >= txn.updatedAt + inspectionDays[_transactionId] * 1 days), "Escrow: only buyer can confirm");
        // Must be in 'Delivered' state
        require(txn.status == Status.Delivered, "Escrow: invalid status for completion");

        txn.status    = Status.Completed;
        txn.updatedAt = block.timestamp;

        // Record that these two addresses completed a deal
        completedWith[txn.buyer][txn.seller] = true;
        completedWith[txn.seller][txn.buyer] = true;

        // Notify the Reputation contract (if linked)
        if (reputationContract != address(0)) {
            IReputation(reputationContract).updateOnCompletion(txn.buyer, true, false);
            IReputation(reputationContract).updateOnCompletion(txn.seller, true, false);
        }

        // Transfer funds to the seller (protected by nonReentrant)
        (bool success, ) = txn.seller.call{value: txn.amount}("");
        require(success, "Escrow: transfer to seller failed");

        emit Completed(_transactionId, txn.seller, txn.amount);
    }

    /// @notice Either buyer or seller can raise a dispute, freezing the funds.
    /// @param _transactionId  ID of the transaction to dispute.
    function raiseDispute(uint256 _transactionId) external {
        Transaction storage txn = transactions[_transactionId];

        require(txn.status != Status.Delivered || block.timestamp < txn.updatedAt + inspectionDays[_transactionId] * 1 days, "Inspection expired");
        // Only buyer or seller can raise a dispute
        require(
            msg.sender == txn.buyer || msg.sender == txn.seller,
            "Escrow: only buyer or seller can dispute"
        );
        // Can dispute from Created or Delivered states
        require(
            txn.status == Status.Created || txn.status == Status.Delivered,
            "Escrow: invalid status for dispute"
        );

        txn.status    = Status.Disputed;
        txn.updatedAt = block.timestamp;

        emit Disputed(_transactionId, msg.sender);
    }

    /// @notice Arbitrator resolves a dispute by sending funds to seller or buyer.
    /// @param _transactionId    ID of the disputed transaction.
    /// @param _releaseToSeller  true = seller wins, false = buyer gets refund.
    function resolveDispute(uint256 _transactionId, bool _releaseToSeller)
        external
        onlyArbitrator
        nonReentrant
    {
        Transaction storage txn = transactions[_transactionId];

        // Must be in 'Disputed' state
        require(txn.status == Status.Disputed, "Escrow: not in disputed state");

        if (_releaseToSeller) {
            // Seller wins the dispute
            txn.status = Status.Completed;

            // Record completed relationship
            completedWith[txn.buyer][txn.seller] = true;
            completedWith[txn.seller][txn.buyer] = true;

            // Notify reputation: seller won, buyer lost
            if (reputationContract != address(0)) {
                IReputation(reputationContract).updateOnCompletion(txn.seller, true, true);
                IReputation(reputationContract).updateOnCompletion(txn.buyer, false, true);
            }

            (bool success, ) = txn.seller.call{value: txn.amount}("");
            require(success, "Escrow: transfer to seller failed");
        } else {
            // Buyer wins — refund
            txn.status = Status.Refunded;

            // Notify reputation: buyer won, seller lost
            if (reputationContract != address(0)) {
                IReputation(reputationContract).updateOnCompletion(txn.buyer, true, true);
                IReputation(reputationContract).updateOnCompletion(txn.seller, false, true);
            }

            (bool success, ) = txn.buyer.call{value: txn.amount}("");
            require(success, "Escrow: refund to buyer failed");
        }

        txn.updatedAt = block.timestamp;

        emit Resolved(_transactionId, _releaseToSeller);
    }

    // -------------------------------------------------------
    //  View / Helper Functions
    // -------------------------------------------------------

    /// @notice Permissionless recovery after a delivery or arbitration timeout.
    function refundExpired(uint256 id) external nonReentrant {
        Transaction storage txn = transactions[id];
        require((txn.status == Status.Created && block.timestamp >= txn.createdAt + DELIVERY_TIMEOUT) ||
            (txn.status == Status.Disputed && block.timestamp >= txn.updatedAt + DISPUTE_TIMEOUT), "Not expired");
        require(txn.amount > 0, "Unknown escrow");
        txn.status = Status.Refunded;
        txn.updatedAt = block.timestamp;
        (bool ok,) = txn.buyer.call{value: txn.amount}("");
        require(ok, "Refund failed");
        emit Resolved(id, false);
    }

    /// @notice Returns full details of a transaction.
    function getTransaction(uint256 _transactionId)
        external
        view
        returns (
            address buyer,
            address seller,
            uint256 amount,
            Status  status,
            uint256 createdAt,
            uint256 updatedAt
        )
    {
        Transaction storage txn = transactions[_transactionId];
        return (txn.buyer, txn.seller, txn.amount, txn.status, txn.createdAt, txn.updatedAt);
    }

    /// @notice Check if two addresses have completed at least one transaction together.
    function hasCompletedTransaction(address _a, address _b) external view returns (bool) {
        return completedWith[_a][_b];
    }
}

// -------------------------------------------------------
//  Interface for calling the Reputation contract
// -------------------------------------------------------

interface IReputation {
    function updateOnCompletion(address user, bool won, bool disputed) external;
}
