// Build script for Vercel deployment
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Update imports for production environment
async function updateImports() {
  console.log('🔄 Updating imports for production environment...');
  
  try {
    // Create dist directory if it doesn't exist
    if (!fs.existsSync('./dist')) {
      fs.mkdirSync('./dist', { recursive: true });
    }
    
    // Run the Vite build 
    console.log('🔨 Building client with Vite...');
    execSync('npx vite build --outDir dist', { stdio: 'inherit' });
    
    console.log('✅ Client build completed');
    
    return true;
  } catch (error) {
    console.error('❌ Build failed:', error);
    return false;
  }
}

// Main build function
async function build() {
  console.log('🚀 Starting Vercel build process...');
  
  try {
    // Step 1: Update imports
    const importsUpdated = await updateImports();
    if (!importsUpdated) {
      throw new Error('Failed to update imports');
    }
    
    // Step 2: Copy necessary files
    console.log('📋 Copying static assets...');
    
    // Copy public assets to dist
    if (fs.existsSync('./public')) {
      execSync('cp -r ./public/* ./dist/', { stdio: 'inherit' });
    }
    
    console.log('🎉 Build completed successfully');
  } catch (error) {
    console.error('❌ Build process failed:', error);
    process.exit(1);
  }
}

// Run the build
build();