// Express application for API server
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import API handlers
import rootHandler, { 
  minimal,
  health,
  dbTest,
  pooledTest,
  diagnostics
} from './index.js';

// Initialize environment
dotenv.config();

// Get directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files from public directory
app.use(express.static(join(__dirname, '..', 'public')));

// Debug middleware
app.use((req, res, next) => {
  // Log request info
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API routes
app.get('/api', rootHandler);
app.all('/api/minimal', minimal);
app.all('/api/health', health);
app.all('/api/db-test', dbTest);
app.all('/api/pooled-test', pooledTest);
app.all('/api/diagnostics', diagnostics);

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    message: 'API is working',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      accept: req.headers.accept
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error in API handler:', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    error: err.message
  });
});

// For serverless function usage
export default app;