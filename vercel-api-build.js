/**
 * Special build script for Vercel API deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Starting Vercel API build...');

// Ensure API directory exists
const apiDir = path.join(__dirname, 'api');
if (!fs.existsSync(apiDir)) {
  console.error('API directory not found');
  process.exit(1);
}

// Get all JS files in the API directory
const apiFiles = fs.readdirSync(apiDir)
  .filter(file => file.endsWith('.js'));

console.log(`Found ${apiFiles.length} API files`);

// Fix imports to use .js extension for ESM compatibility
for (const file of apiFiles) {
  const filePath = path.join(apiDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Check for local imports without .js extension
  const importPattern = /from ['"]\.\/([^'"\.]+)['"]/g;
  if (importPattern.test(content)) {
    console.log(`Fixing imports in ${file}`);
    
    // Replace local imports to include .js extension
    content = content.replace(
      importPattern,
      (match, p1) => `from './${p1}.js'`
    );
    
    fs.writeFileSync(filePath, content);
  }
}

// Create output directory for diagnostics
const outputDir = path.join(__dirname, '.vercel-api-build');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Generate a manifest of all API files
const manifest = {
  buildTime: new Date().toISOString(),
  apiFiles: apiFiles,
  environment: {
    node: process.version,
    platform: process.platform,
    env: process.env.NODE_ENV || 'development'
  }
};

fs.writeFileSync(
  path.join(outputDir, 'api-manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log('Vercel API build completed successfully');
process.exit(0);