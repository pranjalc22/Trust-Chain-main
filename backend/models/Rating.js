// ============================================================
//  models/Rating.js — Counterparty Rating & Review Model
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Rating = sequelize.define(
  "Rating",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transaction_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "transactions",
        key: "id",
      },
    },
    from_wallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: "users",
        key: "wallet_address",
      },
      set(value) {
        this.setDataValue("from_wallet", value ? value.toLowerCase() : value);
      },
    },
    to_wallet: {
      type: DataTypes.STRING(42),
      allowNull: false,
      references: {
        model: "users",
        key: "wallet_address",
      },
      set(value) {
        this.setDataValue("to_wallet", value ? value.toLowerCase() : value);
      },
    },
    stars: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "ratings",
    indexes: [{unique:true, fields:["transaction_id", "from_wallet"]}],
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Rating;
