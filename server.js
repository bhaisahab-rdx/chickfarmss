/**
 * ChickFarms Production Server for Render Deployment
 * 
 * This file is used by Render to start the production server.
 * It handles both the API endpoints and serves the static files.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Store route registrations
let registerRoutes;
let registerNowPaymentsRoutes;

// Simple function to load compiled server code
async function loadRoutes() {
  console.log('Loading server routes...');
  
  try {
    // Force production mode to use dist folder
    process.env.NODE_ENV = 'production';
    
    console.log('Looking for compiled routes in dist directory...');
    
    // For Render deployment, we'll just load directly from the dist folder
    // Since we manually run the build steps in buildCommand
    if (fs.existsSync('./dist/routes.js')) {
      console.log('Found compiled routes.js file');
      
      // The import() function is available in Node.js even in CommonJS modules
      try {
        const routesModule = await import('./dist/routes.js');
        console.log('Successfully loaded routes.js');
        
        if (routesModule && typeof routesModule.registerRoutes === 'function') {
          registerRoutes = routesModule.registerRoutes;
          console.log('Successfully loaded main route registration function');
        } else {
          console.error('routes.js exists but does not export registerRoutes function!');
          process.exit(1);
        }
      } catch (err) {
        console.error('Failed to import routes.js:', err);
        process.exit(1);
      }
    } else {
      console.error('Could not find compiled routes.js in dist directory!');
      console.error('Current directory contents:', fs.readdirSync('./'));
      console.error('Dist directory exists?', fs.existsSync('./dist'));
      if (fs.existsSync('./dist')) {
        console.error('Dist directory contents:', fs.readdirSync('./dist'));
      }
      process.exit(1);
    }
    
    // Load payment routes the same way
    if (fs.existsSync('./dist/routes-nowpayments.js')) {
      console.log('Found compiled routes-nowpayments.js file');
      
      try {
        const paymentsModule = await import('./dist/routes-nowpayments.js');
        console.log('Successfully loaded routes-nowpayments.js');
        
        if (paymentsModule && typeof paymentsModule.registerRoutes === 'function') {
          registerNowPaymentsRoutes = paymentsModule.registerRoutes;
          console.log('Successfully loaded payment route registration function');
        } else {
          console.error('routes-nowpayments.js exists but does not export registerRoutes function!');
          // Not exiting as payments might be optional
        }
      } catch (err) {
        console.error('Failed to import routes-nowpayments.js:', err);
        // Not exiting as payments might be optional
      }
    } else {
      console.warn('Could not find compiled routes-nowpayments.js in dist directory');
    }
  } catch (error) {
    console.error('Error importing routes:', error);
    process.exit(1);
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