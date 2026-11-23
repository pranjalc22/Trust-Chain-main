// ============================================================
//  models/User.js — User / Wallet Profile Model
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    wallet_address: {
      type: DataTypes.STRING(42),
      primaryKey: true,
      allowNull: false,
      validate: {
        is: /^0x[a-fA-F0-9]{40}$/i,
      },
      set(value) {
        // Always store wallet addresses in normalized lowercase
        this.setDataValue("wallet_address", value ? value.toLowerCase() : value);
      },
    },
    display_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    nonce: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: "One-time cryptographically random challenge for wallet sign-in",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;
