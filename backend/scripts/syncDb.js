// ============================================================
//  scripts/syncDb.js — Database Table Synchronization Script
// ============================================================
//  Usage: node scripts/syncDb.js
//  Creates or alters tables for users, transactions, disputes, ratings.
// ============================================================

require("dotenv").config();
const { sequelize } = require("../models");

async function syncDatabase() {
  console.log("=== TrustChain Database Synchronization ===");
  console.log(`Connecting to: ${process.env.DATABASE_URL ? "DATABASE_URL specified" : "default localhost"}`);

  try {
    await sequelize.authenticate();
    console.log("✅ Database connection verified.");

    console.log("🔄 Syncing models with database schema...");
    await sequelize.sync({ alter: true });

    console.log("✅ All tables created / updated successfully:");
    console.log("   • users");
    console.log("   • transactions");
    console.log("   • disputes");
    console.log("   • ratings");
    console.log("=== Synchronization Complete ===");
    process.exit(0);
  } catch (error) {
    console.error("❌ Database sync failed:", error.message);
    process.exit(1);
  }
}

syncDatabase();
