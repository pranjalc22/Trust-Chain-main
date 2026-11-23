// ============================================================
//  models/Dispute.js — Dispute Record Model
// ============================================================

const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Dispute = sequelize.define(
  "Dispute",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    transaction_id: {
      unique: true,
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "transactions",
        key: "id",
      },
    },
    raised_by: {
      type: DataTypes.STRING(42),
      allowNull: false,
      set(value) {
        this.setDataValue("raised_by", value ? value.toLowerCase() : value);
      },
    },
    evidence_buyer: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evidence_seller: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(32),
      allowNull: false,
      defaultValue: "Open",
      validate: {
        isIn: [
          [
            "Open",
            "Under Review",
            "Resolved_Buyer",
            "Resolved_Seller",
            "Dismissed",
          ],
        ],
      },
    },
    resolved_by: {
      type: DataTypes.STRING(42),
      allowNull: true,
      set(value) {
        this.setDataValue("resolved_by", value ? value.toLowerCase() : value);
      },
    },
    resolution: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "disputes",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Dispute;
