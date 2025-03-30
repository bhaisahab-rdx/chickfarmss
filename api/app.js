// Vercel API handler for ChickFarms
const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();

// Set up CORS with permissive settings for debugging
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Simple route to test if the API is working
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    time: new Date().toISOString(),
    env: process.env.NODE_ENV || 'unknown',
    message: 'This is a simplified API handler for Vercel deployment'
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

// Export the Express app for Vercel
module.exports = app;