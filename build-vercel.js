/**
 * Build script for Vercel deployment
 * 
 * This script prepares the project for deployment to Vercel by:
 * 1. Ensuring all imports use .js extensions for ESM compatibility
 * 2. Creating the necessary API routes for serverless functions
 * 3. Setting up environment variables
 * 4. Creating a manual Vercel output structure with a single API function
 *    to stay within the 12-function limit of the Vercel Hobby plan
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
    
    // 4. Create manual Vercel output structure
    await createVercelOutputStructure();
    
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
# Ignore HTML files in public to ensure React app is served
public/*.html
`;
    
    fs.writeFileSync(vercelIgnorePath, ignoreContent);
  } else {
    // Update existing .vercelignore to include HTML files
    let vercelIgnoreContent = fs.readFileSync(vercelIgnorePath, 'utf8');
    if (!vercelIgnoreContent.includes('public/*.html')) {
      vercelIgnoreContent += '\n# Ignore HTML files in public to ensure React app is served\npublic/*.html\n';
      fs.writeFileSync(vercelIgnorePath, vercelIgnoreContent);
      console.log('Updated .vercelignore to exclude HTML files in public directory');
    }
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
    
    // SPECIAL CONFIGURATION: We need to preserve routes for this project
    console.log('Checking routing configuration...');
    
    // For this specific project, we want to use routes instead of rewrites
    if (vercelConfig.rewrites && !vercelConfig.routes) {
      console.log('Converting rewrites to routes format for better compatibility...');
      
      vercelConfig.routes = vercelConfig.rewrites.map(rewrite => ({
        src: rewrite.source || rewrite.src,
        dest: rewrite.destination || rewrite.dest
      }));
      
      // Remove the rewrites property
      delete vercelConfig.rewrites;
      configUpdated = true;
    }
    
    // If we have routes, we need to remove headers which are incompatible
    if (vercelConfig.routes && vercelConfig.headers) {
      console.log('Warning: "routes" cannot be used alongside "headers"');
      console.log('Removing "headers" to avoid Vercel configuration conflicts...');
      
      delete vercelConfig.headers;
      configUpdated = true;
    }
    
    // FUNCTION LIMIT FIX: Ensure we're using a single API function for all routes
    // to stay within the 12-function limit of Vercel's Hobby plan
    if (vercelConfig.routes) {
      // Always consolidate routes to a single function
      console.log('Consolidating API routes to stay within Vercel function limits...');
      
      // Get specific routes for special handling (preserve their order and pattern)
      const specialRoutes = vercelConfig.routes.filter(route => 
        route.src === '/api/vercel-debug' || 
        route.src === '/api/debug-spin' || 
        route.src === '/api/diagnostics' || 
        route.src === '/api/health' || 
        route.src === '/api/spin/status' || 
        route.src === '/api/spin/spin' || 
        route.src === '/api/spin/claim-extra' || 
        route.src === '/api/spin/(.*)' || 
        route.src === '/api/auth/(.*)'
      );
      
      // Get non-API routes
      const nonApiRoutes = vercelConfig.routes.filter(route => 
        !route.src || !route.src.startsWith('/api/')
      );
      
      // Build a new routes array with special routes first, then catch-all API route, then non-API routes
      vercelConfig.routes = [
        ...specialRoutes,
        { src: '/api/(.*)', dest: '/api' },
        ...nonApiRoutes
      ];
      
      configUpdated = true;
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

/**
 * Create a manual Vercel output structure with a single API function
 * This consolidates all API routes into a single serverless function
 * to stay within the 12-function limit of the Vercel Hobby plan
 */
async function createVercelOutputStructure() {
  console.log('Creating manual Vercel output structure with a single API function...');
  
  // Create the necessary directories
  const outputDir = path.join(__dirname, '.vercel', 'output');
  const functionsDir = path.join(outputDir, 'functions');
  const staticDir = path.join(outputDir, 'static');
  const apiFuncDir = path.join(functionsDir, 'api.func');
  
  // Create directories if they don't exist
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(functionsDir, { recursive: true });
  fs.mkdirSync(staticDir, { recursive: true });
  fs.mkdirSync(apiFuncDir, { recursive: true });
  
  // Create config.json in the output directory
  const configJson = {
    version: 3,
    routes: [
      // Explicitly block access to HTML game files in public directory
      { src: '/vercel-test.html', status: 404, dest: '/index.html' },
      { src: '/health.html', status: 404, dest: '/index.html' },
      { src: '/login.html', status: 404, dest: '/index.html' },
      { src: '/register.html', status: 404, dest: '/index.html' },
      { src: '/game.html', status: 404, dest: '/index.html' },
      { src: '/public/index.html', status: 404, dest: '/index.html' },
      { src: '/public/game.html', status: 404, dest: '/index.html' },
      // Specific debug endpoints with high priority
      { src: '/api/vercel-debug', dest: '/api' },
      { src: '/api/debug-spin', dest: '/api' },
      // Spin-specific endpoints - high priority to ensure they're handled correctly
      { src: '/api/spin/status', dest: '/api' },
      { src: '/api/spin/spin', dest: '/api' },
      { src: '/api/spin/claim-extra', dest: '/api' },
      { src: '/api/spin/(.*)', dest: '/api' },
      // Route all other API calls to the consolidated API function
      { src: '/api/(.*)', dest: '/api' },
      // Serve files from the filesystem first
      { handle: 'filesystem' },
      // Everything else goes to the React app's index.html
      { src: '/(.*)', dest: '/index.html' }
    ],
    env: {
      NODE_ENV: 'production',
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres.zgsyciaoixairqqfwvyt:thekinghu8751@aws-0-ap-south-1.pooler.supabase.com:6543/postgres',
      SESSION_SECRET: process.env.SESSION_SECRET || 'w8smRGPCRnWFtBSPf9cD',
      NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY || 'JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3',
      NOWPAYMENTS_IPN_SECRET_KEY: process.env.NOWPAYMENTS_IPN_SECRET_KEY || 'A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um'
    }
  };
  
  fs.writeFileSync(
    path.join(outputDir, 'config.json'),
    JSON.stringify(configJson, null, 2)
  );
  
  // Create .vc-config.json in the API function directory
  const vcConfigJson = {
    runtime: 'nodejs20.x',
    handler: 'index.js',
    launcherType: 'Nodejs'
  };
  
  fs.writeFileSync(
    path.join(apiFuncDir, '.vc-config.json'),
    JSON.stringify(vcConfigJson, null, 2)
  );
  
  // Create the consolidated API handler
  // Check for either .js or .cjs extension
  let consolidatedApiPath = path.join(__dirname, 'api', 'consolidated.js');
  
  if (!fs.existsSync(consolidatedApiPath)) {
    // Try .cjs extension
    consolidatedApiPath = path.join(__dirname, 'api', 'consolidated.cjs');
  }
  
  if (fs.existsSync(consolidatedApiPath)) {
    // Copy the consolidated API file to the function directory
    fs.copyFileSync(
      consolidatedApiPath,
      path.join(apiFuncDir, 'index.js')
    );
    console.log(`Copied ${consolidatedApiPath} to API function directory`);
  } else {
    console.error('Error: consolidated.js or consolidated.cjs not found in the api directory.');
    console.error('Please create api/consolidated.js or api/consolidated.cjs with your consolidated API handler.');
    process.exit(1);
  }
  
  // Copy static assets to the static directory
  console.log('Copying static assets to output directory...');
  
  const publicDir = path.join(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    // Function to copy files recursively, excluding HTML files
    const copyFilesRecursive = (src, dest) => {
      const entries = fs.readdirSync(src, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        
        // Skip HTML files (these will be blocked by our routing rules)
        if (entry.isFile() && entry.name.endsWith('.html')) {
          console.log(`Skipping HTML file: ${srcPath}`);
          continue;
        }
        
        // Create directories
        if (entry.isDirectory()) {
          fs.mkdirSync(destPath, { recursive: true });
          copyFilesRecursive(srcPath, destPath);
        } else {
          // Copy files
          fs.copyFileSync(srcPath, destPath);
        }
      }
    };
    
    // Copy public directory contents to static directory
    try {
      copyFilesRecursive(publicDir, staticDir);
      console.log('Static assets copied successfully');
    } catch (error) {
      console.error(`Error copying static assets: ${error.message}`);
    }
  } else {
    console.log('Public directory not found, skipping static asset copy');
  }
  
  console.log('Manual Vercel output structure created successfully.');
}

// Run the build
build();