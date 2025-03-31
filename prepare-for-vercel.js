/**
 * ChickFarms Vercel Deployment Preparation Script (Enhanced Version)
 * 
 * This script prepares your ChickFarms application for deployment to Vercel
 * by updating all necessary configuration files to ensure proper routing
 * for the spin functionality and fixing common deployment issues.
 * 
 * Updates in this enhanced version:
 * - Improved route ordering with prioritized spin endpoints
 * - Added explicit route for vercel-debug.js
 * - Better error handling and validation
 * - More detailed logging
 */

import fs from 'fs';
import path from 'path';

// Log with colors
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m"
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

// Update vercel.json
function updateVercelJson() {
  log('\n📝 Updating vercel.json...', colors.cyan);
  
  try {
    const vercelJsonPath = 'vercel.json';
    
    if (!fs.existsSync(vercelJsonPath)) {
      log('⚠️ vercel.json not found! Creating new file...', colors.yellow);
      const defaultConfig = {
        version: 2,
        buildCommand: "node build-vercel.js && npm run build",
        outputDirectory: "dist",
        routes: [],
        env: {}
      };
      fs.writeFileSync(vercelJsonPath, JSON.stringify(defaultConfig, null, 2), 'utf8');
    }
    
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Set up proper routes with spin endpoints first
    vercelJson.routes = [
      { src: "/api/debug-spin", dest: "/api" },
      { src: "/api/spin/status", dest: "/api" },
      { src: "/api/spin/spin", dest: "/api" },
      { src: "/api/spin/claim-extra", dest: "/api" },
      { src: "/api/spin/(.*)", dest: "/api" },
      { src: "/api/(.*)", dest: "/api" },
      { src: "/(.*)", dest: "/index.html" }
    ];
    
    // Ensure the NODE_ENV is set to production
    if (!vercelJson.env) {
      vercelJson.env = {};
    }
    vercelJson.env.NODE_ENV = "production";
    
    // Write the updated configuration
    fs.writeFileSync(vercelJsonPath, JSON.stringify(vercelJson, null, 2), 'utf8');
    log('✅ vercel.json updated successfully!', colors.green);
    return true;
  } catch (error) {
    log(`❌ Error updating vercel.json: ${error.message}`, colors.red);
    return false;
  }
}

// Update .vercel/output/config.json if it exists
function updateVercelOutputConfig() {
  log('\n📝 Checking for .vercel/output/config.json...', colors.cyan);
  
  const configPath = '.vercel/output/config.json';
  
  if (!fs.existsSync(configPath)) {
    log('⚠️ .vercel/output/config.json not found. Will be created by build-vercel.js script.', colors.yellow);
    return true;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Find the position right before "handle": "filesystem" or at the end
    const routes = config.routes || [];
    const filesystemIndex = routes.findIndex(route => route.handle === "filesystem");
    let insertPosition = filesystemIndex > -1 ? filesystemIndex : routes.length;
    
    // Remove existing API route patterns we'll replace
    const routesToKeep = routes.filter(route => {
      return !(
        (route.src === "/api/debug-spin" && route.dest === "/api") ||
        (route.src === "/api/spin/status" && route.dest === "/api") ||
        (route.src === "/api/spin/spin" && route.dest === "/api") ||
        (route.src === "/api/spin/claim-extra" && route.dest === "/api") ||
        (route.src === "/api/spin/(.*)" && route.dest === "/api") ||
        (route.src === "/api/(.*)" && route.dest === "/api")
      );
    });
    
    // Insert new API routes in the correct order
    const apiRoutes = [
      { src: "/api/debug-spin", dest: "/api" },
      { src: "/api/spin/status", dest: "/api" },
      { src: "/api/spin/spin", dest: "/api" },
      { src: "/api/spin/claim-extra", dest: "/api" },
      { src: "/api/spin/(.*)", dest: "/api" },
      { src: "/api/(.*)", dest: "/api" }
    ];
    
    routesToKeep.splice(insertPosition, 0, ...apiRoutes);
    config.routes = routesToKeep;
    
    // Write the updated configuration
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    log('✅ .vercel/output/config.json updated successfully!', colors.green);
    return true;
  } catch (error) {
    log(`❌ Error updating .vercel/output/config.json: ${error.message}`, colors.red);
    return false;
  }
}

// Main function
async function main() {
  log('🚀 ChickFarms Vercel Deployment Preparation', colors.magenta);
  log('==========================================\n');
  
  let success = true;
  
  // Update vercel.json
  if (!updateVercelJson()) {
    success = false;
  }
  
  // Update .vercel/output/config.json if it exists
  if (!updateVercelOutputConfig()) {
    success = false;
  }
  
  // Final summary
  log('\n==========================================', colors.magenta);
  if (success) {
    log('✅ All configurations updated successfully!', colors.green);
    log('\n🔍 Next steps:', colors.cyan);
    log('1. Run the build-vercel.js script: node build-vercel.js', colors.cyan);
    log('2. Deploy to Vercel using the Vercel CLI or GitHub integration', colors.cyan);
    log('3. After deployment, test the /api/debug-spin endpoint on your Vercel domain', colors.cyan);
    log('4. If issues persist, check the Vercel function logs in the Vercel dashboard', colors.cyan);
  } else {
    log('⚠️ Some updates failed. Please review the errors above.', colors.yellow);
  }
}

// Run the main function
main().catch(error => {
  log(`❌ Fatal error: ${error.message}`, colors.red);
  process.exit(1);
});