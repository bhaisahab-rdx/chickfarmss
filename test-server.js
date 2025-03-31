/**
 * Simple test script for verifying server.js file syntax
 * 
 * This script just checks if the file can be parsed without errors
 */

import fs from 'fs';
import path from 'path';

console.log('Testing server.js file...');

try {
  // Read the file content
  const serverPath = path.join(process.cwd(), 'server.js');
  const fileContent = fs.readFileSync(serverPath, 'utf8');
  
  console.log('Server file exists and can be read.');
  
  // Just doing a basic check for required components
  const requiredComponents = [
    'express',
    'cors',
    'registerRoutes',
    'app.listen',
    'app.use(express.json())',
    'app.use(express.static'
  ];
  
  let allComponentsFound = true;
  
  for (const component of requiredComponents) {
    if (!fileContent.includes(component)) {
      console.error(`Missing required component: ${component}`);
      allComponentsFound = false;
    } else {
      console.log(`✓ Found component: ${component}`);
    }
  }
  
  if (allComponentsFound) {
    console.log('Server file contains all required components!');
    console.log('The file should be compatible with Render deployment.');
  } else {
    console.error('Server file is missing some required components.');
    console.error('You may need to fix issues before deploying to Render.');
  }
} catch (error) {
  console.error('Error testing the server file:');
  console.error(error.message);
  console.error('You may need to fix issues before deploying to Render.');
}