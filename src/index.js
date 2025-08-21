require("dotenv").config();
const express = require("express");
const cors = require("cors");
const proxyRoutes = require("./routes/proxy");
const thirdPartyRoutes = require("./routes/third-party");
const usageRoutes = require("./routes/usage");
const cacheService = require("./services/cache");
const ipfsProxyRoutes = require("./routes/ipfs-proxy");

const app = express();
const port = process.env.PORT || 3000;

// Define your whitelist
const whitelist = process.env.WHITELISTED_ORIGINS.split(",") || [
  "https://sheets.fileverse.io",
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true); // allow request
    } else {
      callback(new Error(`Origin: ${origin} is not in the whitelist`)); // block request
    }
  },
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

// Routes
app.use("/proxy", proxyRoutes);
app.use("/third-party", thirdPartyRoutes);
app.use("/usage", usageRoutes);
app.use("/ipfs-proxy", ipfsProxyRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

const server = app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("HTTP server closed");
    cacheService.disconnect();
    process.exit(0);
  });
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("HTTP server closed");
    cacheService.disconnect();
    process.exit(0);
  });
});
