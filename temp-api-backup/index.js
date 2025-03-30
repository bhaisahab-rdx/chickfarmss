// Main API handler for Vercel API routes
// This file serves as the entry point for all API routes

// Re-export handlers
export { default as minimal } from './minimal.js';
export { default as health } from './health.js';
export { default as dbTest } from './db-test.js';
export { default as pooledTest } from './pooled-test.js';
export { default as diagnostics } from './diagnostics.js';

/**
 * Default handler for the API root
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'ChickFarms API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/minimal',
      '/api/health',
      '/api/db-test',
      '/api/pooled-test',
      '/api/diagnostics'
    ]
  });
}