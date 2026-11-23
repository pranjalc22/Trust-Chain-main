// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  Reputation.sol — TrustChain Reputation Contract
// ============================================================
//  Tracks each user's on-chain reputation based on:
//    • Completed transactions
//    • Disputes won / lost
//    • Star ratings from counterparties
//
//  Score formula:
//    score = (completedTransactions × 10)
//          + (averageRating × 5)
//          - (disputesLost × 15)
// ============================================================

import "./Escrow.sol";   // We need access to the Escrow contract

contract Reputation {
    // -------------------------------------------------------
    //  Data Structures
    // -------------------------------------------------------

    /// @notice Stores all reputation data for a single user.
    struct ReputationData {
        uint256 completedTransactions;  // Total deals completed (wins count)
        uint256 disputesLost;           // Number of disputes lost
        uint256 disputesWon;            // Number of disputes won
        uint256 totalRatingSum;         // Sum of all star ratings received
        uint256 ratingCount;            // Number of ratings received
    }

    // -------------------------------------------------------
    //  State Variables
    // -------------------------------------------------------

    /// @notice The Escrow contract that is allowed to call updateOnCompletion.
    Escrow public escrowContract;

    /// @notice Maps each address to its ReputationData.
    mapping(address => ReputationData) public reputations;

    /// @notice Prevents duplicate ratings: rater → ratee → rated?
    mapping(uint256 => mapping(address => bool)) public hasRated;

    // -------------------------------------------------------
    //  Events
    // -------------------------------------------------------

    /// @notice Emitted when a user submits a star rating for another user.
    event RatingSubmitted(
        address indexed rater,
        address indexed ratedUser,
        uint8   stars
    );

    /// @notice Emitted when a user's reputation data changes.
    event ReputationUpdated(
        address indexed user,
        uint256 completedTransactions,
        uint256 disputesWon,
        uint256 disputesLost
    );

    // -------------------------------------------------------
    //  Modifiers
    // -------------------------------------------------------

    /// @notice Only the linked Escrow contract can call functions with this.
    modifier onlyEscrow() {
        require(
            msg.sender == address(escrowContract),
            "Reputation: caller is not the Escrow contract"
        );
        _;
    }

    // -------------------------------------------------------
    //  Constructor
    // -------------------------------------------------------

    /// @notice Deploys the Reputation contract and links it to Escrow.
    /// @param _escrowContract  Address of the deployed Escrow contract.
    constructor(address _escrowContract) {
        require(_escrowContract != address(0), "Reputation: invalid escrow address");
        escrowContract = Escrow(_escrowContract);
    }

    // -------------------------------------------------------
    //  Core Functions
    // -------------------------------------------------------

    /// @notice Called by the Escrow contract when a transaction completes
    ///         or a dispute is resolved.
    /// @param _user  The user whose reputation should be updated.
    /// @param _won   true = user won / completed successfully,
    ///               false = user lost the dispute.
    function updateOnCompletion(address _user, bool _won, bool disputed) external onlyEscrow {
        ReputationData storage rep = reputations[_user];

        if (_won) {
            // User completed a transaction or won a dispute
            rep.completedTransactions++;
            if (disputed) rep.disputesWon++;   // Also counts as a "win"
        } else {
            // User lost the dispute
            rep.disputesLost++;
        }

        emit ReputationUpdated(
            _user,
            rep.completedTransactions,
            rep.disputesWon,
            rep.disputesLost
        );
    }

    /// @notice Submit a 1-5 star rating for another user.
    ///         Requires that the caller has completed at least one
    ///         transaction with the rated user (verified via Escrow).
    /// @param _ratedUser  The user being rated.
    /// @param _stars      Rating between 1 and 5 (inclusive).
    function submitRating(uint256 transactionId, address _ratedUser, uint8 _stars) external {
        // --- Validations ---
        require(_stars >= 1 && _stars <= 5, "Reputation: stars must be 1-5");
        require(_ratedUser != msg.sender, "Reputation: cannot rate yourself");
        require(
            !hasRated[transactionId][msg.sender],
            "Reputation: already rated this user"
        );

        (address buyer, address seller,, Escrow.Status status,,) = escrowContract.getTransaction(transactionId);
        require(status == Escrow.Status.Completed && ((msg.sender == buyer && _ratedUser == seller) || (msg.sender == seller && _ratedUser == buyer)), "Reputation: no completed transaction with this user");
        // Check that the caller actually did business with this user
        require(
            escrowContract.hasCompletedTransaction(msg.sender, _ratedUser),
            "Reputation: no completed transaction with this user"
        );

        // --- Update rating data ---
        hasRated[transactionId][msg.sender] = true;

        ReputationData storage rep = reputations[_ratedUser];
        rep.totalRatingSum += _stars;
        rep.ratingCount++;

        emit RatingSubmitted(msg.sender, _ratedUser, _stars);

        emit ReputationUpdated(
            _ratedUser,
            rep.completedTransactions,
            rep.disputesWon,
            rep.disputesLost
        );
    }

    // -------------------------------------------------------
    //  View Functions
    // -------------------------------------------------------

    /// @notice Calculates and returns a user's reputation score.
    ///
    ///  Formula:
    ///    score = (completedTransactions × 10)
    ///          + (averageRating × 5)
    ///          - (disputesLost × 15)
    ///
    ///  The score is returned as an integer. If the penalty exceeds
    ///  the positive score, 0 is returned (no negative scores).
    ///
    /// @param _user  Address to look up.
    /// @return score  The calculated reputation score.
    function getReputationScore(address _user) external view returns (uint256 score) {
        ReputationData storage rep = reputations[_user];

        // Positive component: completed transactions
        uint256 positiveScore = rep.completedTransactions * 10;

        // Positive component: average rating (× 5)
        // averageRating = totalRatingSum / ratingCount
        // We multiply first to keep integer precision:
        //   (totalRatingSum * 5) / ratingCount
        if (rep.ratingCount > 0) {
            positiveScore += (rep.totalRatingSum * 5) / rep.ratingCount;
        }

        // Negative component: disputes lost
        uint256 penalty = rep.disputesLost * 15;

        // Prevent underflow — score cannot go below 0
        if (positiveScore > penalty) {
            score = positiveScore - penalty;
        } else {
            score = 0;
        }
    }

    /// @notice Returns the full reputation struct for a user.
    function getReputation(address _user)
        external
        view
        returns (
            uint256 completedTransactions,
            uint256 disputesLost,
            uint256 disputesWon,
            uint256 totalRatingSum,
            uint256 ratingCount
        )
    {
        ReputationData storage rep = reputations[_user];
        return (
            rep.completedTransactions,
            rep.disputesLost,
            rep.disputesWon,
            rep.totalRatingSum,
            rep.ratingCount
        );
    }
}
