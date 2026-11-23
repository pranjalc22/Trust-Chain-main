// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ============================================================
//  ReentrancyAttacker.sol — TEST-ONLY Helper Contract
// ============================================================
//  This contract simulates a reentrancy attack by trying to
//  call confirmCompletion again when it receives ETH.
//  It is used in tests to verify that ReentrancyGuard works.
//  DO NOT deploy this to mainnet!
// ============================================================

import "../Escrow.sol";

contract ReentrancyAttacker {
    Escrow public escrow;
    uint256 public attackTxId;
    bool    public attacking;

    constructor(address _escrow) {
        escrow = Escrow(_escrow);
    }

    /// @notice Creates an escrow transaction (this contract is the "buyer").
    function createEscrow(address _seller) external payable {
        escrow.createTransaction{value: msg.value}(payable(_seller), 3);
    }

    /// @notice Attempts the reentrancy attack by calling confirmCompletion.
    function attack(uint256 _txId) external {
        attackTxId = _txId;
        attacking  = true;
        escrow.confirmCompletion(_txId);
    }

    /// @notice This is the reentrancy vector — when the Escrow contract
    ///         sends ETH to this contract, the receive function triggers
    ///         and tries to drain a DIFFERENT transaction (the next one).
    receive() external payable {
        if (attacking) {
            attacking = false;
            // Try to re-enter with the next transaction ID
            // This should be blocked by ReentrancyGuard
            try escrow.confirmCompletion(attackTxId + 1) {} catch {}
        }
    }
}
