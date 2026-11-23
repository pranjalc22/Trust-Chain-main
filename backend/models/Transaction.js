// ============================================================
//  models/Transaction.js — Escrow Transaction Model
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Transaction = sequelize.define(
  "Transaction",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    buyer_wallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: "users",
        key: "wallet_address",
      },
      set(value) {
        this.setDataValue("buyer_wallet", value ? value.toLowerCase() : value);
      },
    },
    seller_wallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: "users",
        key: "wallet_address",
      },
      set(value) {
        this.setDataValue("seller_wallet", value ? value.toLowerCase() : value);
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    amount: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: "Amount represented as string to preserve exact crypto token decimals",
    },
    currency: {
      type: DataTypes.STRING(16),
      allowNull: false,
      defaultValue: "ETH",
    },
    delivery_terms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    inspection_period_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "Created",
      validate: {
        isIn: [
          [
            "Created",
            "In Progress",
            "Delivered",
            "Completed",
            "Disputed",
            "Refunded",
            "Cancelled",
          ],
        ],
      },
    },
    on_chain_tx_id: {
      unique: true,
      type: DataTypes.STRING(128),
      allowNull: true,
      comment: "Transaction hash or on-chain escrow ID from smart contract",
    },
  },
  {
    tableName: "transactions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Transaction;
