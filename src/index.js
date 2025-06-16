require('dotenv').config();
const express = require('express');
const cors = require('cors');
const proxyRoutes = require('./routes/proxy');
const thirdPartyRoutes = require('./routes/third-party');
const usageRoutes = require('./routes/usage');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/proxy', proxyRoutes);
app.use('/third-party', thirdPartyRoutes);
app.use('/usage', usageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
}); 