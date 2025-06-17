const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');

const services = [
  'ETHERSCAN_API_KEY',
  'BASESCAN_API_KEY',
  'GNOSIS_API_KEY',
  'COINGECKO_API_KEY',
  'FIRE_FLY_API_KEY',
  'NEYNAR_API_KEY',
  'DEFILLAMA_API_KEY'
];

router.get('/', async (req, res) => {
  try {
    const data = {};
    services.forEach(service => {
      const used = 100;
      const remaining = Math.floor(Math.random() * 100) + 1;
      data[service] = {
        used,
        remaining
      };
    });
    res.json(data);
  } catch (error) {
    console.error('Usage route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/id', async (req, res) => {
  try {    
    const data = {
      randomId: "hello",
    };
    res.json(data);
  } catch (error) {
    console.error('Usage route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 
