// ============================================================
//  models/index.js — Sequelize Models & Associations Index
// ============================================================

const sequelize = require("../config/database");
const User = require("./User");
const Transaction = require("./Transaction");
const Dispute = require("./Dispute");
const Rating = require("./Rating");

// ------------------------------------------------------------
//  Associations
// ------------------------------------------------------------

// User <-> Transaction (Buyer)
User.hasMany(Transaction, {
  foreignKey: "buyer_wallet",
  as: "buyerTransactions",
});
Transaction.belongsTo(User, {
  foreignKey: "buyer_wallet",
  as: "buyer",
});

// User <-> Transaction (Seller)
User.hasMany(Transaction, {
  foreignKey: "seller_wallet",
  as: "sellerTransactions",
});
Transaction.belongsTo(User, {
  foreignKey: "seller_wallet",
  as: "seller",
});

// Transaction <-> Dispute (1:1)
Transaction.hasOne(Dispute, {
  foreignKey: "transaction_id",
  as: "dispute",
});
Dispute.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "transaction",
});

// Transaction <-> Rating (1:M)
Transaction.hasMany(Rating, {
  foreignKey: "transaction_id",
  as: "ratings",
});
Rating.belongsTo(Transaction, {
  foreignKey: "transaction_id",
  as: "transaction",
});

// User <-> Rating (Received & Given)
User.hasMany(Rating, {
  foreignKey: "to_wallet",
  as: "receivedRatings",
});
Rating.belongsTo(User, {
  foreignKey: "to_wallet",
  as: "recipient",
});

User.hasMany(Rating, {
  foreignKey: "from_wallet",
  as: "givenRatings",
});
Rating.belongsTo(User, {
  foreignKey: "from_wallet",
  as: "author",
});

module.exports = {
  sequelize,
  User,
  Transaction,
  Dispute,
  Rating,
};
