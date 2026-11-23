// ============================================================
//  server.js — HTTP Server Entry Point
// ============================================================

require("dotenv").config();
const app = require("./app");
const { sequelize } = require("./models");
const contractService = require("./blockchain/contractService");

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    console.log("--------------------------------------------------");
    console.log("🚀 Initializing TrustChain Backend...");
    console.log("--------------------------------------------------");

    // 1. Connect to Database
    try {
      await sequelize.authenticate();
      console.log("✅ Database connection established successfully.");

      // Auto-sync tables in development if enabled or tables missing
      if (process.env.AUTO_SYNC_DB === "true") {
        console.log("🔄 Synchronizing database tables...");
        await sequelize.sync({ alter: true });
        console.log("✅ Database tables synchronized.");
      }
    } catch (dbErr) {
      throw dbErr;

    }

    // 2. Start HTTP Server
    const server = app.listen(PORT, () => {
      console.log(`🌐 Server running at: http://localhost:${PORT}`);
      console.log(`📡 Health check:     http://localhost:${PORT}/api/health`);
      console.log("--------------------------------------------------");
    });

    // 3. Connect to Smart Contracts & Start Live Event Listeners
    contractService
      .startEventListeners()
      .catch((err) => {
        console.warn("⚠️  Blockchain event listener failed to start:", err.message);
      });

    // Graceful shutdown
    const handleShutdown = async (signal) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        console.log("Closed HTTP server.");
        try {
          await sequelize.close();
          console.log("Closed database connection.");
        } catch {}
        process.exit(0);
      });
    };

    process.on("SIGINT", () => handleShutdown("SIGINT"));
    process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  } catch (error) {
    console.error("❌ Fatal error during server startup:", error);
    process.exit(1);
  }
}

startServer();
