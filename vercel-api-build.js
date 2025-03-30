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

// Create a root index.html file for Vercel
const rootIndexPath = path.join(__dirname, 'index.html');

if (!fs.existsSync(rootIndexPath)) {
  console.log('Creating root index.html for redirection...');
  
  // Create a styled redirect index.html at the root
  const indexContent = `<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/dist/public/index.html" />
  <title>ChickFarms - Loading...</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f7f9fc;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .loader-container {
      padding: 20px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #f8931f; /* ChickFarms orange */
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    h1 {
      color: #f8931f;
      margin-bottom: 10px;
    }
    p {
      color: #666;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader-container">
    <div class="loader"></div>
    <h1>ChickFarms</h1>
    <p>Loading your farming adventure...</p>
  </div>
</body>
</html>`;
  
  fs.writeFileSync(rootIndexPath, indexContent);
  console.log('Created root index.html for redirection');
}

console.log('Vercel API build completed successfully');
process.exit(0);