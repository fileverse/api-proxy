const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const cacheService = require('../services/cache');
const proxyService = require('../services/proxy');

router.post('/', authMiddleware, async (req, res) => {
  try {
    const targetUrl = req.headers['target-url'];
    if (!targetUrl) {
      return res.status(400).json({ error: 'Target-URL header is required' });
    }

    // Generate cache key
    const cacheKey = cacheService.generateCacheKey(
      req.method,
      targetUrl,
      req.body
    );

    // Check cache
    const cachedResponse = await cacheService.get(cacheKey);
    if (cachedResponse) {
      return res
        .status(cachedResponse.status)
        .set(cachedResponse.headers)
        .json(cachedResponse.data);
    }

    // Forward request
    const response = await proxyService.forwardRequest(
      targetUrl,
      req.method,
      req.headers,
      req.body
    );

    // Cache successful responses
    if (response.status === 200) {
      await cacheService.set(cacheKey, response);
    }

    // Track usage
    await cacheService.incrementUserUsage(req.user.token);

    // Send response
    return res
      .status(response.status)
      .set(response.headers)
      .json(response.data);
  } catch (error) {
    console.error('Proxy route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 