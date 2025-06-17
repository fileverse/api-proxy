const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const thirdPartyService = require('../services/third-party');

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { service, payload, param1, param2 } = req.query;
    if (!service || !payload) {
      return res.status(400).json({ error: 'Service and payload are required' });
    }
    const response = await thirdPartyService.handler(service, payload);
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
