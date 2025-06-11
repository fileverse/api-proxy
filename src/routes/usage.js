const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const cacheService = require('../services/cache');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const usage = await cacheService.getUserUsage(req.user.token);
    const rateLimit = process.env.RATE_LIMIT_MAX_REQUESTS || 100;
    
    res.json({
      usage,
      rateLimit,
      remaining: Math.max(0, rateLimit - usage)
    });
  } catch (error) {
    console.error('Usage route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 