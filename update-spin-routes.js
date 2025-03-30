/**
 * ChickFarms Vercel Deployment - Spin Routes Update
 * 
 * This script updates the Vercel output configuration to ensure
 * spin-related routes are properly configured.
 */

import fs from 'fs';
import path from 'path';

// Paths to key configuration files
const CONFIG_PATH = '.vercel/output/config.json';
const FUNC_CONFIG_PATH = '.vercel/output/functions/api.func/.vc-config.json';

console.log('ChickFarms Spin Routes Update Tool');
console.log('==================================');
console.log('This tool ensures that the spin-related routes are properly configured in Vercel output files.');

// Function to get proper order for route patterns
function getProperRouteOrder() {
  return [
    { src: "/api/debug-spin", dest: "/api" },
    { src: "/api/spin/(.*)", dest: "/api" },
    { src: "/api/(.*)", dest: "/api" },
  ];
}

async function updateVercelConfig() {
  try {
    // Check if the config file exists
    if (!fs.existsSync(CONFIG_PATH)) {
      console.error(`Error: Config file not found at ${CONFIG_PATH}`);
      return false;
    }

    // Read the config file
    const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
    const config = JSON.parse(configContent);

    // Get the routes array
    const routes = config.routes || [];

    // Remove existing API routes that we're going to replace
    const filteredRoutes = routes.filter(route => {
      return !(
        (route.src === "/api/debug-spin" && route.dest === "/api") ||
        (route.src === "/api/spin/(.*)" && route.dest === "/api") ||
        (route.src === "/api/(.*)" && route.dest === "/api")
      );
    });

    // Find the position right before "handle": "filesystem" or the end
    let insertPosition = filteredRoutes.findIndex(route => route.handle === "filesystem");
    if (insertPosition === -1) {
      insertPosition = filteredRoutes.length;
    }

    // Insert the API routes in the correct order
    const apiRoutes = getProperRouteOrder();
    filteredRoutes.splice(insertPosition, 0, ...apiRoutes);

    // Update the config
    config.routes = filteredRoutes;

    // Write the updated config back to the file
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Updated ${CONFIG_PATH} with proper API route order`);
    return true;
  } catch (error) {
    console.error(`Error updating Vercel config: ${error.message}`);
    return false;
  }
}

async function updateFunctionConfig() {
  try {
    // Check if the function config file exists
    if (!fs.existsSync(FUNC_CONFIG_PATH)) {
      console.error(`Error: Function config file not found at ${FUNC_CONFIG_PATH}`);
      return false;
    }

    // Read the function config file
    const configContent = fs.readFileSync(FUNC_CONFIG_PATH, 'utf8');
    const config = JSON.parse(configContent);

    // Ensure the handler is set to index.js
    if (config.handler !== 'index.js') {
      config.handler = 'index.js';
      console.log('Updated handler to index.js');
    }

    // Ensure the runtime is set correctly
    if (config.runtime !== 'nodejs20.x') {
      config.runtime = 'nodejs20.x';
      console.log('Updated runtime to nodejs20.x');
    }

    // Write the updated config back to the file
    fs.writeFileSync(FUNC_CONFIG_PATH, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Updated ${FUNC_CONFIG_PATH}`);
    return true;
  } catch (error) {
    console.error(`Error updating function config: ${error.message}`);
    return false;
  }
}

async function run() {
  console.log('Starting update process...');
  
  const vercelConfigUpdated = await updateVercelConfig();
  const funcConfigUpdated = await updateFunctionConfig();
  
  if (vercelConfigUpdated && funcConfigUpdated) {
    console.log('\n✅ All updates completed successfully.');
    console.log('\nReminder: After deploying to Vercel, use the /api/debug-spin endpoint to test');
    console.log('the spin functionality and diagnose any issues.');
  } else {
    console.log('\n⚠️ Some updates could not be completed. Please check the errors above.');
  }
}

// Run the update process
run().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});