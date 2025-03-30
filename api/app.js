// Vercel API handler for ChickFarms
const express = require('express');
const cors = require('cors');
const serverless = require('serverless-http');

// Create Express app
const app = express();

// Set up CORS with correct settings for production
app.use(cors({
  origin: ['https://chiket.vercel.app', 'http://localhost:3000', 'https://chickfarms.replit.app', '*'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Simple route to test if the API is working
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown',
    version: '1.0.0',
    message: 'ChickFarms API entry point'
  });
});

// Basic diagnostic endpoint
app.get('/diagnostics', (req, res) => {
  // Send basic diagnostics without exposing sensitive info
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    vercel: !!process.env.VERCEL,
    hasEnvVars: {
      database: !!process.env.DATABASE_URL,
      session: !!process.env.SESSION_SECRET,
      payments: !!process.env.NOWPAYMENTS_API_KEY
    },
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    method: req.method
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message
  });
});

// Export both the app and a serverless handler for different deployment modes
module.exports = app;
module.exports.handler = serverless(app);