/**
 * Custom build script for Render deployment
 * 
 * This script handles the build process for Render deployment without relying on
 * package.json scripts that might not work in the Render environment.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting ChickFarms build for Render deployment...');

try {
  // Ensure all dependencies are installed
  console.log('Making sure all dependencies are installed...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Install dev dependencies explicitly
  console.log('Installing development dependencies...');
  execSync('npm install vite esbuild @vitejs/plugin-react typescript', { stdio: 'inherit' });
  
  // Build the frontend
  console.log('Building the frontend with Vite...');
  execSync('npx vite build', { stdio: 'inherit' });
  
  // Build the backend
  console.log('Building the backend with esbuild...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
  
  // Copy server.js to the root directory
  console.log('Setup complete. The application should now be ready for Render deployment.');
} catch (error) {
  console.error('Error during build:', error);
  process.exit(1);
}