require('dotenv').config();
const express = require('express');
const proxyRoutes = require('./routes/proxy');
const usageRoutes = require('./routes/usage');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use('/proxy', proxyRoutes);
app.use('/usage', usageRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
}); 