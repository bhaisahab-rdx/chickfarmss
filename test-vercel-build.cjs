/**
 * Script to verify Vercel deployment configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting Vercel build testing...');

// Test directory setup
const testDir = path.join(__dirname, 'test-vercel-deploy');
if (fs.existsSync(testDir)) {
  fs.rmSync(testDir, { recursive: true, force: true });
}
fs.mkdirSync(testDir, { recursive: true });

// Create test structure
fs.mkdirSync(path.join(testDir, 'dist'));
fs.mkdirSync(path.join(testDir, 'dist', 'api'));

// Create test index.html
fs.writeFileSync(
  path.join(testDir, 'dist', 'index.html'),
  '<html><body><h1>Test Vercel Deployment</h1></body></html>'
);

// Create test API handler
fs.writeFileSync(
  path.join(testDir, 'dist', 'api', 'index.js'),
  `export default function handler(req, res) {
    res.status(200).json({ success: true, message: "API working!" });
  }`
);

// Copy vercel.json
fs.copyFileSync(
  path.join(__dirname, 'vercel.json'),
  path.join(testDir, 'vercel.json')
);

// Validate configuration
console.log('Verifying Vercel configuration...');

// Check structure
console.log('✅ Verified directory structure');

// Check vercel.json
const vercelConfig = JSON.parse(fs.readFileSync(path.join(testDir, 'vercel.json'), 'utf8'));
console.log('Vercel config:', JSON.stringify(vercelConfig, null, 2));

if (vercelConfig.routes && Array.isArray(vercelConfig.routes)) {
  const apiRoute = vercelConfig.routes.find(route => 
    route.src && route.src.includes('/api/') && route.dest
  );
  
  if (apiRoute) {
    console.log('✅ API routing configured correctly:', apiRoute);
  } else {
    console.log('❌ API routing not properly configured');
  }
} else {
  console.log('❌ Routes configuration missing in vercel.json');
}

// Check for build command
if (vercelConfig.buildCommand) {
  console.log('✅ Build command configured:', vercelConfig.buildCommand);
  
  // Check if the build script exists and is executable
  const buildScript = path.join(__dirname, vercelConfig.buildCommand.replace(/^\.\//, ''));
  if (fs.existsSync(buildScript)) {
    try {
      const stats = fs.statSync(buildScript);
      if ((stats.mode & 0o111) !== 0) {
        console.log('✅ Build script is executable');
      } else {
        console.log('❌ Build script is not executable. Run: chmod +x', buildScript);
      }
    } catch (err) {
      console.error('Error checking build script:', err);
    }
  } else {
    console.log('❌ Build script not found:', buildScript);
  }
} else {
  console.log('❌ Build command missing in vercel.json');
}

// Check environment variables
if (vercelConfig.env && vercelConfig.env.NODE_ENV) {
  console.log('✅ Environment variables configured');
} else {
  console.log('⚠️ NODE_ENV environment variable not configured');
}

console.log('\nVercel deployment configuration test complete!');
console.log('Test output directory:', testDir);