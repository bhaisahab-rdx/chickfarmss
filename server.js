/**
 * ChickFarms Production Server
 * 
 * This file is used by Render to start the production server.
 * It handles both the API endpoints and serves the static files.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import server routes
// We'll use direct imports from the dist folder when available
try {
  // For production, routes will be available from dist
  if (process.env.NODE_ENV === 'production') {
    // In production, we'll import from the dist directory
    console.log('Running in production mode, using compiled routes from dist');
    const { registerRoutes } = await import('./dist/routes.js');
    const { registerRoutes: registerNowPaymentsRoutes } = await import('./dist/routes-nowpayments.js');
    global.registerRoutes = registerRoutes;
    global.registerNowPaymentsRoutes = registerNowPaymentsRoutes;
  } else {
    // In development, we'll import directly from TypeScript files
    console.log('Running in development mode, using TypeScript routes');
    const { registerRoutes } = await import('./server/routes.js');
    const { registerRoutes: registerNowPaymentsRoutes } = await import('./server/routes-nowpayments.js');
    global.registerRoutes = registerRoutes;
    global.registerNowPaymentsRoutes = registerNowPaymentsRoutes;
  }
} catch (error) {
  console.error('Error importing routes:', error);
}

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Register API routes
try {
  // Register main API routes
  const server = await global.registerRoutes(app);
  console.log('Main API routes registered successfully');
  
  // Register NOW Payments routes
  await global.registerNowPaymentsRoutes(app);
  console.log('NOW Payments API routes registered successfully');
} catch (error) {
  console.error('Error registering API routes:', error);
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
app.listen(PORT, '0.0.0.0', () => {
  console.log(`ChickFarms server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database connection: ${process.env.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  console.log(`API available at: http://localhost:${PORT}/api/health`);
});

export default app;