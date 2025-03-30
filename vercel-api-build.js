/**
 * Special build script for Vercel API deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('Starting Vercel API build process...');

// Create necessary directories
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

if (!fs.existsSync('./dist/api')) {
  fs.mkdirSync('./dist/api');
}

// Build the API
try {
  console.log('Building API with esbuild...');
  execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/api', { stdio: 'inherit' });
  console.log('API build complete!');
} catch (error) {
  console.error('Error building API:', error);
  process.exit(1);
}

// Create the serverless function to redirect requests
const serverlessFunction = `
import { createServer } from 'http';
import { parse } from 'url';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import serverless from 'serverless-http';
import app from './index.js';

// Get the handler from serverless
const handler = serverless(app);

export default async function (req, res) {
  // Handle serverless function
  return await handler(req, res);
}
`;

// Write the serverless function
fs.writeFileSync('./dist/api/_serverless.js', serverlessFunction);

console.log('Creating Vercel functions configuration...');
// Create a Vercel functions configuration file
const vercelConfig = `
{
  "version": 2,
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}
`;

fs.writeFileSync('./dist/api/vercel.json', vercelConfig);

console.log('Vercel API build script completed successfully!');