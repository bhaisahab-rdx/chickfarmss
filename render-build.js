/**
 * Comprehensive build script for Render deployment
 * 
 * This script handles the complete build process for Render deployment by:
 * 1. Installing all necessary dependencies (including dev dependencies)
 * 2. Building the frontend with Vite
 * 3. Building the backend with esbuild
 * 4. Setting up the correct NODE_ENV for production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Starting ChickFarms build for Render deployment...');

// Helper function to run a command and log its output
function runCommand(command, message) {
  console.log(`> ${message}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✓ ${message} completed successfully`);
    return true;
  } catch (error) {
    console.error(`✗ ${message} failed:`, error.message);
    return false;
  }
}

// Main build function
async function build() {
  try {
    // Set production environment
    process.env.NODE_ENV = 'production';
    console.log(`NODE_ENV set to: ${process.env.NODE_ENV}`);
    
    // Ensure all dependencies are installed
    console.log('\n--- STEP 1: Installing dependencies ---');
    if (!runCommand('npm install', 'Installing main dependencies')) {
      throw new Error('Failed to install main dependencies');
    }
    
    // Install ALL development dependencies explicitly
    console.log('\n--- STEP 2: Installing build tools ---');
    if (!runCommand(
      'npm install --save vite esbuild @vitejs/plugin-react typescript @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-shadcn-theme-json tailwindcss tailwindcss-animate postcss autoprefixer',
      'Installing build tools'
    )) {
      throw new Error('Failed to install build tools');
    }
    
    // Check if vite is installed and available
    console.log('\n--- STEP 3: Verifying build tools ---');
    try {
      execSync('npx vite --version', { stdio: 'pipe' });
      console.log('✓ Vite is installed and available');
    } catch (error) {
      console.error('✗ Vite is not available, trying global install');
      runCommand('npm install -g vite', 'Installing Vite globally');
    }
    
    // Build the frontend with Vite
    console.log('\n--- STEP 4: Building frontend ---');
    if (!runCommand('npx vite build', 'Building frontend with Vite')) {
      throw new Error('Failed to build frontend');
    }
    
    // Build the backend with esbuild
    console.log('\n--- STEP 5: Building backend ---');
    if (!runCommand(
      'npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist',
      'Building backend with esbuild'
    )) {
      throw new Error('Failed to build backend');
    }
    
    // Check if dist directory was created and contains expected files
    console.log('\n--- STEP 6: Verifying build output ---');
    if (fs.existsSync('dist')) {
      console.log('✓ dist directory exists');
      const distFiles = fs.readdirSync('dist');
      console.log('Files in dist directory:', distFiles.join(', '));
    } else {
      throw new Error('dist directory was not created');
    }
    
    console.log('\n✓ Build completed successfully! The application should now be ready for Render deployment.');
  } catch (error) {
    console.error('\n✗ Build failed:', error.message);
    process.exit(1);
  }
}

// Run the build
build();