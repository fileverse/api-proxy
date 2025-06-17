const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const thirdPartyService = require('../services/third-party');

router.get('/', async (req, res) => {
  try {
    const { service, category, graphType, input1, input2 } = req.query;
    if (!service || !category || !graphType) {
      return res.status(400).json({ error: 'Service, graphType and category are required' });
    }
    const response = await thirdPartyService.handler({ service, graphType, category, input1, input2 });
    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
