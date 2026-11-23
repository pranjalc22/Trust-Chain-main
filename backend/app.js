// ============================================================
//  app.js — Express Application Configuration
// ============================================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./routes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// Middlewares
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRequests = new Map();
const authSweep = setInterval(() => { for (const [key, value] of authRequests) if (value.until < Date.now()) authRequests.delete(key); }, 60000);
authSweep.unref();
app.use('/api/auth', (req, res, next) => {
  const key = req.ip;
  let entry = authRequests.get(key);
  if (!entry || entry.until < Date.now()) { entry = {count:0, until:Date.now()+60000}; authRequests.set(key, entry); }
  if (++entry.count > 30) return res.status(429).json({message:'Too many sign-in requests; retry in a minute'});
  next();
});
// Mount API routes under /api
app.use("/api", apiRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "TrustChain Off-chain REST API",
    version: "1.0.0",
    docs: "/api/health",
  });
});

// 404 & Global Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
