// Simple server to test our API endpoints
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import cors from 'cors';

// Import our API handlers
import minimal from './minimal.js';
import health from './health.js';
import dbTest from './db-test.js';
import pooledTest from './pooled-test.js';
import diagnostics from './diagnostics.js';

// Initialize environment
dotenv.config();

// Create Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(express.json());
app.use(cors());

// Map our API endpoints
app.all('/api/minimal', minimal);
app.all('/api/health', health);
app.all('/api/db-test', dbTest);
app.all('/api/pooled-test', pooledTest);
app.all('/api/diagnostics', diagnostics);

// Basic endpoint with version info
app.get('/', (req, res) => {
  res.json({
    message: 'ChickFarms API Server',
    version: '1.0.0',
    endpoints: [
      '/api/minimal',
      '/api/health',
      '/api/db-test',
      '/api/pooled-test',
      '/api/diagnostics'
    ]
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API test server running at http://0.0.0.0:${PORT}`);
});

export default app;