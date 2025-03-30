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
    
    // 3. Check and fix vercel.json configuration
    await validateVercelConfig();
    
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

/**
 * Validate and fix the vercel.json configuration
 * Ensures properties are used correctly according to Vercel guidelines
 */
async function validateVercelConfig() {
  console.log('Validating vercel.json configuration...');
  
  const vercelConfigPath = path.join(__dirname, 'vercel.json');
  
  if (fs.existsSync(vercelConfigPath)) {
    let vercelConfig;
    let configUpdated = false;
    
    try {
      const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
      vercelConfig = JSON.parse(configContent);
    } catch (error) {
      throw new Error(`Failed to parse vercel.json: ${error.message}`);
    }
    
    // Issue 1: Check if both builds and functions properties exist
    if (vercelConfig.builds && vercelConfig.functions) {
      console.log('Warning: Found both "builds" and "functions" properties in vercel.json');
      console.log('These properties cannot be used together in Vercel. Moving function config to build config...');
      
      // For each function configuration
      for (const functionPattern in vercelConfig.functions) {
        const functionConfig = vercelConfig.functions[functionPattern];
        
        // Find matching build configuration
        const matchingBuildIndex = vercelConfig.builds.findIndex(build => 
          build.src === functionPattern || 
          (functionPattern.includes('*') && build.src.startsWith(functionPattern.split('*')[0]))
        );
        
        if (matchingBuildIndex !== -1) {
          // Add config to the build
          vercelConfig.builds[matchingBuildIndex].config = {
            ...vercelConfig.builds[matchingBuildIndex].config,
            ...functionConfig
          };
        }
      }
      
      // Remove the functions property
      delete vercelConfig.functions;
      configUpdated = true;
    }
    
    // Issue 2: Check if routes is used alongside headers, rewrites, redirects, etc.
    const incompatibleWithRoutes = ['headers', 'rewrites', 'redirects', 'cleanUrls', 'trailingSlash'];
    const hasIncompatibleProps = incompatibleWithRoutes.some(prop => vercelConfig[prop]);
    
    if (vercelConfig.routes && hasIncompatibleProps) {
      console.log('Warning: "routes" cannot be used alongside headers, rewrites, redirects, cleanUrls or trailingSlash');
      console.log('Converting routes to rewrites...');
      
      // Convert routes to rewrites if they don't exist yet
      if (!vercelConfig.rewrites) {
        vercelConfig.rewrites = vercelConfig.routes.map(route => ({
          source: route.src,
          destination: route.dest
        }));
        
        // Remove the routes property
        delete vercelConfig.routes;
        configUpdated = true;
      }
    }
    
    // Write back to vercel.json if changes were made
    if (configUpdated) {
      fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
      console.log('Updated vercel.json successfully');
    } else {
      console.log('No configuration issues found in vercel.json');
    }
  } else {
    console.log('vercel.json not found, skipping validation');
  }
}

// Run the build
build();