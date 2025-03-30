/**
 * Build script for Vercel deployment
 * 
 * This script prepares the project for deployment to Vercel by:
 * 1. Ensuring all imports use .js extensions for ESM compatibility
 * 2. Creating the necessary API routes for serverless functions
 * 3. Setting up environment variables
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Main build function
 */
async function build() {
  console.log('Starting Vercel build process...');
  
  // Ensure we're in production mode
  process.env.NODE_ENV = 'production';
  
  try {
    // 1. Update imports to include .js extensions
    await updateImports();
    
    // 2. Set up API endpoint
    await setupApiEndpoint();
    
    console.log('Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

/**
 * Update imports to include .js extensions for ESM
 */
async function updateImports() {
  console.log('Updating imports for ESM compatibility...');
  
  const apiDir = path.join(__dirname, 'api');
  
  // Get all JS files in the API directory
  const files = fs.readdirSync(apiDir)
    .filter(file => file.endsWith('.js'));
  
  for (const file of files) {
    const filePath = path.join(apiDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Add .js extension to local imports
    content = content.replace(
      /from ['"]\.\/([^'"]+)['"]/g,
      (match, p1) => {
        // If the imported file doesn't have an extension, add .js
        if (!p1.includes('.')) {
          return `from './${p1}.js'`;
        }
        return match;
      }
    );
    
    fs.writeFileSync(filePath, content);
  }
}

/**
 * Set up API endpoint and Vercel-specific configuration
 */
async function setupApiEndpoint() {
  console.log('Setting up API endpoints for Vercel...');
  
  // Add debug route to the app.js file
  const appFilePath = path.join(__dirname, 'api', 'app.js');
  
  if (fs.existsSync(appFilePath)) {
    let content = fs.readFileSync(appFilePath, 'utf8');
    
    // Check if debug route already exists
    if (!content.includes('/api/debug')) {
      // Find the section with API routes
      const routesPattern = /\/\/ API routes/;
      if (routesPattern.test(content)) {
        content = content.replace(
          routesPattern,
          `// API routes\napp.get('/api/debug', (req, res) => {
  res.json({
    message: 'API is working',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    vercel: {
      isVercel: !!(process.env.VERCEL || process.env.VERCEL_URL),
      url: process.env.VERCEL_URL || 'not set'
    },
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      accept: req.headers.accept
    }
  });
});`
        );
        
        fs.writeFileSync(appFilePath, content);
      }
    }
  }
  
  // Create a .vercelignore file if it doesn't exist
  const vercelIgnorePath = path.join(__dirname, '.vercelignore');
  
  if (!fs.existsSync(vercelIgnorePath)) {
    const ignoreContent = `# Ignore files that aren't needed for Vercel deployment
node_modules
npm-debug.log
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local
.git
.github
`;
    
    fs.writeFileSync(vercelIgnorePath, ignoreContent);
  }
}

// Run the build
build();