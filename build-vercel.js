// Optimized build script for Vercel deployment
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Main build function - optimized for Vite + Node.js deployment
async function build() {
  console.log('🚀 Starting Vercel build process...');
  
  try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('./dist')) {
      fs.mkdirSync('./dist', { recursive: true });
    }
    
    // Use the existing build command from package.json
    // This will run vite build and build the server
    console.log('🔨 Building application...');
    
    // Run Vite build directly to avoid recursive call
    execSync('npx vite build', { stdio: 'inherit' });
    
    // Build the server with esbuild
    execSync('esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { stdio: 'inherit' });
    
    // Copy public assets to dist if not already covered by Vite
    if (fs.existsSync('./public')) {
      console.log('📋 Copying static assets...');
      execSync('cp -r ./public/* ./dist/', { stdio: 'inherit' });
    }
    
    console.log('🎉 Build completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Build process failed:', error);
    process.exit(1);
  }
}

// Create the API directory after the build
// This ensures server-side code is accessible through the /api route in Vercel
async function setupApiEndpoint() {
  // Make sure we have the API directory
  if (!fs.existsSync('./dist/api')) {
    fs.mkdirSync('./dist/api', { recursive: true });
  }
  
  console.log('📋 Copying API handlers from /api to /dist/api...');
  
  // Copy standalone API handlers from the api directory
  if (fs.existsSync('./api')) {
    const apiFiles = fs.readdirSync('./api');
    
    for (const file of apiFiles) {
      if (file.endsWith('.js')) {
        // Read file content
        const sourceContent = fs.readFileSync(`./api/${file}`, 'utf8');
        // Write to destination
        fs.writeFileSync(`./dist/api/${file}`, sourceContent);
        console.log(`  ✅ Copied ./api/${file} to ./dist/api/${file}`);
      }
    }
  }
  
  // Create a lightweight API handler that imports the server code
  fs.writeFileSync('./dist/api/server.js', `
import { createServer } from 'http';
import { app } from '../index.js';

// Create and export the server
const server = createServer(app);
export default server;
`);
  
  console.log('✅ API endpoint setup completed');
}

// Run the build
build().then(() => {
  setupApiEndpoint();
});