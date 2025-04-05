/**
 * ChickFarms Build Script for Railway Deployment
 * 
 * This script handles building the entire application for production
 * deployment on Railway. It compiles:
 * 1. The client-side React application (via Vite)
 * 2. The server-side TypeScript files (via esbuild)
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Starting ChickFarms build process...');

// Ensure the dist directory exists
if (!fs.existsSync('./dist')) {
  fs.mkdirSync('./dist');
}

// Helper function to run a command and return a promise
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    console.log(`Running: ${command} ${args.join(' ')}`);
    const process = spawn(command, args, { stdio: 'inherit' });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    process.on('error', (err) => {
      reject(err);
    });
  });
}

// Build the frontend first using Vite
async function buildFrontend() {
  console.log('📦 Building frontend with Vite...');
  try {
    await runCommand('npx', ['vite', 'build']);
    console.log('✅ Frontend build successful!');
  } catch (error) {
    console.error('❌ Frontend build failed:', error);
    process.exit(1);
  }
}

// Build all server files
async function buildServer() {
  console.log('🖥️ Building server files with esbuild...');
  
  // List of server files to compile
  const serverFiles = [
    'server/index.ts',
    'server/routes.ts',
    'server/auth.ts',
    'server/routes-nowpayments.ts',
    'server/routes-achievements.ts',
    'server/storage.ts',
    'server/auth-utils.ts',
    'server/db.ts',
    'server/config.ts',
    'server/vite.ts'
  ];
  
  try {
    // Use esbuild to compile all server files
    const esbuildArgs = [
      ...serverFiles,
      '--platform=node',
      '--packages=external',
      '--bundle',
      '--format=esm',
      '--outdir=dist'
    ];
    
    await runCommand('npx', ['esbuild', ...esbuildArgs]);
    console.log('✅ Server build successful!');
  } catch (error) {
    console.error('❌ Server build failed:', error);
    process.exit(1);
  }
}

// Copy any necessary static files to the dist directory
async function copyStaticFiles() {
  console.log('📋 Copying static files...');
  
  // Create .env.production file for deployment if it doesn't exist
  if (!fs.existsSync('./.env.production') && fs.existsSync('./.env')) {
    console.log('Creating .env.production from .env for deployment...');
    fs.copyFileSync('./.env', './.env.production');
  }
  
  console.log('✅ Static files copied!');
}

// Main build process
async function build() {
  try {
    await buildFrontend();
    await buildServer();
    await copyStaticFiles();
    
    console.log('🎉 Build completed successfully!');
    console.log('👉 Use "node server.js" to start the production server');
  } catch (error) {
    console.error('❌ Build process failed:', error);
    process.exit(1);
  }
}

// Run the build process
build();