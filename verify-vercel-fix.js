/**
 * ChickFarms 404 Error Fix Verification Script
 * 
 * This script checks the current Vercel deployment configuration
 * to ensure that the changes to fix the 404 error have been applied correctly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
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

// Verify vercel.json
function verifyVercelJson() {
  log("Verifying vercel.json...", colors.cyan);
  
  const vercelJsonPath = path.join(__dirname, 'vercel.json');
  
  if (!fs.existsSync(vercelJsonPath)) {
    log("❌ vercel.json not found!", colors.red);
    return false;
  }
  
  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Check version
    if (vercelJson.version !== 2) {
      log(`❌ vercel.json has incorrect version: ${vercelJson.version}`, colors.red);
      return false;
    }
    
    // Check build command
    if (!vercelJson.buildCommand || !vercelJson.buildCommand.includes('build-vercel.js')) {
      log("❌ vercel.json is missing the correct buildCommand", colors.red);
      return false;
    }
    
    // Check routes
    if (!vercelJson.routes || !Array.isArray(vercelJson.routes)) {
      log("❌ vercel.json is missing routes array", colors.red);
      return false;
    }
    
    // Check for specific required routes
    const requiredRoutes = [
      "/api/vercel-debug",
      "/api/debug-spin",
      "/api/spin/status",
      "/api/spin/spin",
      "/api/spin/claim-extra",
      "/api/spin/(.*)",
    ];
    
    for (const requiredRoute of requiredRoutes) {
      const routeFound = vercelJson.routes.some(route => route.src === requiredRoute);
      if (!routeFound) {
        log(`❌ Required route not found in vercel.json: ${requiredRoute}`, colors.red);
        return false;
      }
    }
    
    // Check for filesystem handler
    const hasFilesystem = vercelJson.routes.some(route => route.handle === "filesystem");
    if (!hasFilesystem) {
      log("❌ Missing 'filesystem' handler in routes", colors.red);
      return false;
    }
    
    // Check environment variables
    if (!vercelJson.env) {
      log("❌ vercel.json is missing env configuration", colors.red);
      return false;
    }
    
    const requiredEnvVars = ["NODE_ENV", "DATABASE_URL", "SESSION_SECRET"];
    for (const requiredEnv of requiredEnvVars) {
      if (!vercelJson.env[requiredEnv]) {
        log(`❌ Required environment variable missing in vercel.json: ${requiredEnv}`, colors.red);
        return false;
      }
    }
    
    log("✅ vercel.json looks good!", colors.green);
    return true;
  } catch (error) {
    log(`❌ Error parsing vercel.json: ${error.message}`, colors.red);
    return false;
  }
}

// Verify .vercel/output/config.json
function verifyVercelOutputConfig() {
  log("Verifying .vercel/output/config.json...", colors.cyan);
  
  const configPath = path.join(__dirname, '.vercel', 'output', 'config.json');
  
  if (!fs.existsSync(configPath)) {
    log("ℹ️ .vercel/output/config.json not found. This is normal if you haven't run build-vercel.js yet.", colors.yellow);
    return true;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check version
    if (config.version !== 3) {
      log(`❌ config.json has incorrect version: ${config.version}`, colors.red);
      return false;
    }
    
    // Check routes
    if (!config.routes || !Array.isArray(config.routes)) {
      log("❌ config.json is missing routes array", colors.red);
      return false;
    }
    
    // Check for specific required routes
    const requiredRoutes = [
      "/api/vercel-debug",
      "/api/debug-spin",
      "/api/spin/status",
      "/api/spin/spin",
      "/api/spin/claim-extra",
      "/api/spin/(.*)",
    ];
    
    for (const requiredRoute of requiredRoutes) {
      const routeFound = config.routes.some(route => route.src === requiredRoute);
      if (!routeFound) {
        log(`❌ Required route not found in config.json: ${requiredRoute}`, colors.red);
        return false;
      }
    }
    
    // Check for filesystem handler
    const hasFilesystem = config.routes.some(route => route.handle === "filesystem");
    if (!hasFilesystem) {
      log("❌ Missing 'filesystem' handler in routes", colors.red);
      return false;
    }
    
    log("✅ .vercel/output/config.json looks good!", colors.green);
    return true;
  } catch (error) {
    log(`❌ Error parsing .vercel/output/config.json: ${error.message}`, colors.red);
    return false;
  }
}

// Verify API files
function verifyApiFiles() {
  log("Verifying API files...", colors.cyan);
  
  const requiredApiFiles = [
    'consolidated.cjs',
    'debug-spin.js',
    'vercel-debug.js'
  ];
  
  let allFound = true;
  
  for (const file of requiredApiFiles) {
    const filePath = path.join(__dirname, 'api', file);
    if (!fs.existsSync(filePath)) {
      log(`❌ Required API file not found: ${file}`, colors.red);
      allFound = false;
    }
  }
  
  if (allFound) {
    log("✅ All required API files exist!", colors.green);
    return true;
  }
  
  return false;
}

// Main function
async function main() {
  log("🔍 ChickFarms Vercel 404 Fix Verification", colors.magenta);
  log("=========================================", colors.magenta);
  
  const vercelJsonOk = verifyVercelJson();
  const configJsonOk = verifyVercelOutputConfig();
  const apiFilesOk = verifyApiFiles();
  
  log("\n📋 Verification Summary:", colors.magenta);
  log(`vercel.json: ${vercelJsonOk ? '✅ Good' : '❌ Issues Found'}`, vercelJsonOk ? colors.green : colors.red);
  log(`output config: ${configJsonOk ? '✅ Good' : '❌ Issues Found'}`, configJsonOk ? colors.green : colors.red);
  log(`API files: ${apiFilesOk ? '✅ Good' : '❌ Issues Found'}`, apiFilesOk ? colors.green : colors.red);
  
  if (vercelJsonOk && configJsonOk && apiFilesOk) {
    log("\n🎉 All checks passed! Your configuration looks good for fixing the 404 error.", colors.green);
    log("\n📋 Next Steps:", colors.cyan);
    log("1. Run 'node build-vercel.js' to prepare your application for Vercel deployment", colors.cyan);
    log("2. Deploy to Vercel using the Vercel Dashboard or CLI", colors.cyan);
    log("3. After deployment, verify by visiting /api/vercel-debug endpoint", colors.cyan);
  } else {
    log("\n⚠️ Some issues were found with your configuration.", colors.yellow);
    log("Please fix the issues mentioned above before deploying.", colors.yellow);
  }
}

// Run the main function
main().catch(error => {
  log(`❌ Fatal error: ${error.message}`, colors.red);
});