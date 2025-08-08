const express = require("express");
const { forwardIPFSRequest } = require("../services/ipfs-proxy");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const targetUrl = req.headers["target-url"];

    const sourceApp = req.headers["source-app"];

    if (!targetUrl || !sourceApp) {
      return res.status(400).json({
        error: "Target-URL, method, and source-app headers are required",
      });
    }

    const response = await forwardIPFSRequest(targetUrl, sourceApp);

    res.status(response.status).set(response.headers).send(response.data);
  } catch (err) {
    console.error("IPFS proxy error:", err);
    if (err?.message?.includes("Source app is not allowed")) {
      return res.status(400).json({ error: "Source app is not allowed" });
    }
    if (err?.message?.includes("Target URL is not allowed")) {
      return res.status(400).json({ error: "Target URL is not allowed" });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
