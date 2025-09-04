const express = require("express");
const router = express.Router();
const cacheService = require("../services/cache");
const proxyService = require("../services/proxy");
const { isCacheable } = require("../services/utils");

router.get("/", async (req, res) => {
  try {
    const targetUrl = req.headers["target-url"];
    const method = req.headers["method"];
    if (!targetUrl || !method) {
      return res
        .status(400)
        .json({ error: "Target-URL and method headers are required" });
    }

    // // Generate cache key
    const cacheKey = cacheService.generateCacheKey(
      req.method,
      targetUrl,
      req.body
    );
    // Check cache
    const cachedResponse = isCacheable(targetUrl) ? await cacheService.get(cacheKey) : null;
    if(cachedResponse){
      return res
        .status(cachedResponse.status)
        .set(cachedResponse.headers || {})
        .json(cachedResponse.data);
    }

    console.log("serving from proxy");
    // Forward request
    const response = await proxyService.handler(targetUrl, method);

    // Extract serializable parts of the response for caching
    const cacheableResponse = {
      status: response.status,
      headers: response.headers || {},
      data: response.data,
    };

    // Cache successful responses
    if (response.status === 200) {
      await cacheService.set(cacheKey, cacheableResponse);
    }

    // Track usage
    // await cacheService.incrementUserUsage(req.user.token);

    // Send response
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Proxy route error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
