/**
 * ChickFarms Production Server
 * 
 * This file is used by Render to start the production server.
 * It handles both the API endpoints and serves the static files.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

// Setup dynamic imports for CommonJS environment
const requireDynamic = createRequire(__filename);

// Store route registrations
let registerRoutes;
let registerNowPaymentsRoutes;

// Dynamically load routes based on environment
async function loadRoutes() {
  try {
    if (process.env.NODE_ENV === 'production') {
      // In production, load from the compiled dist directory
      console.log('Running in production mode, using compiled routes from dist');
      
      // Use dynamic import() for ESM modules
      try {
        // Try ES modules first
        const { registerRoutes: mainRegisterRoutes } = await import('./dist/routes.js');
        const { registerRoutes: paymentsRegisterRoutes } = await import('./dist/routes-nowpayments.js');
        
        registerRoutes = mainRegisterRoutes;
        registerNowPaymentsRoutes = paymentsRegisterRoutes;
      } catch (esmErr) {
        console.log('ES Module import failed, trying CommonJS require');
        
        // Fallback to CommonJS if ESM fails
        try {
          registerRoutes = require('./dist/routes.js').registerRoutes;
          registerNowPaymentsRoutes = require('./dist/routes-nowpayments.js').registerRoutes;
        } catch (cjsErr) {
          throw new Error(`Failed to load routes: ESM error: ${esmErr.message}, CJS error: ${cjsErr.message}`);
        }
      }
    } else {
      // In development, try to load directly from TypeScript files
      console.log('Running in development mode, using TypeScript routes');
      
      try {
        // Try ES modules first
        const { registerRoutes: mainRegisterRoutes } = await import('./server/routes.js');
        const { registerRoutes: paymentsRegisterRoutes } = await import('./server/routes-nowpayments.js');
        
        registerRoutes = mainRegisterRoutes;
        registerNowPaymentsRoutes = paymentsRegisterRoutes;
      } catch (err) {
        console.error('Error loading development routes:', err);
        throw err;
      }
    }
  } catch (error) {
    console.error('Error importing routes:', error);
    throw error;
  }
}

// Create Express app
const app = express();

// Configure CORS
app.use(cors({
  origin: true,
  credentials: true
}));

// Parse JSON request body
app.use(express.json());

// Serve static files from the dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// Initialize the application async function
async function initializeApp() {
  // Load routes first
  await loadRoutes();
  
  try {
    // Register main API routes
    const server = await registerRoutes(app);
    console.log('Main API routes registered successfully');
    
    // Register NOW Payments routes
    await registerNowPaymentsRoutes(app);
    console.log('NOW Payments API routes registered successfully');
  } catch (error) {
    console.error('Error registering API routes:', error);
  }
}

// Serve the React app for any routes not handled by the API
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  
  // Serve the index.html for client-side routing
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Add error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 10000;

// Initialize the app and then start the server
initializeApp().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ChickFarms server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database connection: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
    console.log(`API available at: http://localhost:${PORT}/api/health`);
  });
}).catch(err => {
  console.error('Failed to initialize app:', err);
  process.exit(1);
});

module.exports = app;