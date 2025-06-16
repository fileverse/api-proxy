const express = require('express');
const router = express.Router();
const thirdPartyService = require('../services/third-party');

router.post('/', async (req, res) => {
  try {
    const { service, payload } = req.body;
    if (!service || !payload) {
      return res.status(400).json({ error: 'Service, payload and method are required' });
    }

    const response = await thirdPartyService.handler(service, payload);

    return res
      .status(response.status)
      .json(response.data);
  } catch (error) {
    console.error('Proxy route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
