/**
 * ChickFarms Vercel Configuration Test Script
 * 
 * This script verifies your Vercel configuration files are properly set up
 * for handling spin functionality in your deployment.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';

// Logger
const log = {
  info: (msg) => console.log(chalk.blue(`[INFO] ${msg}`)),
  success: (msg) => console.log(chalk.green(`[SUCCESS] ${msg}`)),
  error: (msg) => console.log(chalk.red(`[ERROR] ${msg}`)),
  warn: (msg) => console.log(chalk.yellow(`[WARNING] ${msg}`)),
  title: (msg) => console.log(chalk.magenta.bold(`\n=== ${msg} ===\n`))
};

// Check vercel.json configuration
function checkVercelJson() {
  log.title('Checking vercel.json');
  
  const vercelJsonPath = 'vercel.json';
  
  if (!fs.existsSync(vercelJsonPath)) {
    log.error(`vercel.json not found at ${vercelJsonPath}`);
    return false;
  }
  
  try {
    const vercelJson = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
    
    // Check if the routes array exists
    if (!vercelJson.routes || !Array.isArray(vercelJson.routes)) {
      log.error('vercel.json is missing the routes array');
      return false;
    }
    
    // Check for critical route patterns
    const requiredRoutes = [
      '/api/debug-spin',
      '/api/spin/status',
      '/api/spin/spin',
      '/api/spin/claim-extra',
      '/api/spin/(.*)',
      '/api/(.*)'
    ];
    
    let allFound = true;
    const routes = vercelJson.routes.map(r => r.src || 'unknown');
    
    for (const route of requiredRoutes) {
      if (!routes.includes(route)) {
        log.error(`Missing required route in vercel.json: ${route}`);
        allFound = false;
      }
    }
    
    // Check route order
    let lastIndex = -1;
    let routeOrderCorrect = true;
    
    for (const route of requiredRoutes) {
      const currentIndex = routes.indexOf(route);
      if (currentIndex === -1) continue;
      
      if (currentIndex < lastIndex) {
        log.error(`Route ${route} is in the wrong order. It should come before ${routes[lastIndex]}`);
        routeOrderCorrect = false;
      }
      
      lastIndex = currentIndex;
    }
    
    // Final check results
    if (allFound && routeOrderCorrect) {
      log.success('vercel.json has all required routes in the correct order');
      return true;
    } else {
      if (!allFound) log.error('Some required routes are missing from vercel.json');
      if (!routeOrderCorrect) log.error('Route order in vercel.json is incorrect');
      return false;
    }
  } catch (error) {
    log.error(`Error parsing vercel.json: ${error.message}`);
    return false;
  }
}

// Check Vercel output config
function checkVercelOutputConfig() {
  log.title('Checking .vercel/output/config.json');
  
  const configPath = '.vercel/output/config.json';
  
  if (!fs.existsSync(configPath)) {
    log.warn(`${configPath} not found. This is normal if you haven't run build-vercel.js yet.`);
    return true; // Not critical at this point
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    
    // Check if the routes array exists
    if (!config.routes || !Array.isArray(config.routes)) {
      log.error('Vercel output config is missing the routes array');
      return false;
    }
    
    // Check for critical route patterns
    const requiredRoutes = [
      '/api/debug-spin',
      '/api/spin/status',
      '/api/spin/spin',
      '/api/spin/claim-extra',
      '/api/spin/(.*)',
      '/api/(.*)'
    ];
    
    // Extract routes from config
    const routes = config.routes
      .filter(r => r.dest === '/api')
      .map(r => r.src || 'unknown');
    
    let allFound = true;
    for (const route of requiredRoutes) {
      if (!routes.includes(route)) {
        log.error(`Missing required route in output config: ${route}`);
        allFound = false;
      }
    }
    
    // Check route order
    let lastIndex = -1;
    let routeOrderCorrect = true;
    
    for (const route of requiredRoutes) {
      const currentIndex = routes.indexOf(route);
      if (currentIndex === -1) continue;
      
      if (currentIndex < lastIndex) {
        log.error(`Route ${route} is in the wrong order. It should come before ${routes[lastIndex]}`);
        routeOrderCorrect = false;
      }
      
      lastIndex = currentIndex;
    }
    
    // Final check results
    if (allFound && routeOrderCorrect) {
      log.success('Vercel output config has all required routes in the correct order');
      return true;
    } else {
      if (!allFound) log.error('Some required routes are missing from Vercel output config');
      if (!routeOrderCorrect) log.error('Route order in Vercel output config is incorrect');
      return false;
    }
  } catch (error) {
    log.error(`Error parsing Vercel output config: ${error.message}`);
    return false;
  }
}

// Check for debug-spin.js file
function checkDebugFile() {
  log.title('Checking API Files');
  
  const debugFilePath = 'api/debug-spin.js';
  
  if (!fs.existsSync(debugFilePath)) {
    log.error(`Debug spin endpoint not found at ${debugFilePath}`);
    return false;
  }
  
  log.success(`Found debug spin endpoint at ${debugFilePath}`);
  return true;
}

// Run all checks
async function runChecks() {
  log.title('ChickFarms Vercel Configuration Test');
  
  const results = {
    vercelJson: checkVercelJson(),
    vercelOutputConfig: checkVercelOutputConfig(),
    debugFile: checkDebugFile()
  };
  
  log.title('Test Summary');
  
  let allPassed = true;
  for (const [test, passed] of Object.entries(results)) {
    if (passed) {
      log.success(`${test}: Passed`);
    } else {
      log.error(`${test}: Failed`);
      allPassed = false;
    }
  }
  
  if (allPassed) {
    log.title('All Checks Passed!');
    log.success('Your Vercel configuration appears to be correct for spin functionality.');
    log.info('Next steps:');
    log.info('1. Run node build-vercel.js to generate the final deployment bundle');
    log.info('2. Deploy to Vercel using GitHub integration or Vercel CLI');
    log.info('3. Test the deployed application with the /api/debug-spin endpoint');
  } else {
    log.title('Some Checks Failed');
    log.info('Please fix the issues above and run this test again.');
    log.info('You can use node prepare-for-vercel.js to fix common configuration issues.');
  }
}

// Run the tests
runChecks().catch(error => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});