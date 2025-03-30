/**
 * ChickFarms Spin API Deployment Test Script
 * 
 * This script tests the spin API endpoints to verify they're configured correctly
 * for Vercel deployment. It simulates requests to both local development server
 * and an optional production URL to compare responses.
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

// Configuration
const config = {
  localBaseUrl: 'http://localhost:3000',
  productionBaseUrl: process.env.PRODUCTION_URL || null, // Set to your Vercel deployment URL
  endpoints: [
    { path: '/api/debug-spin', method: 'GET', description: 'Debug endpoint to verify spin routes' },
    { path: '/api/spin/status', method: 'GET', description: 'Spin status endpoint' },
    { path: '/api/spin/spin', method: 'POST', description: 'Perform a spin action' },
    { path: '/api/spin/claim-extra', method: 'POST', description: 'Claim extra spins' }
  ],
  auth: {
    username: 'adminraja',
    password: 'admin8751'
  }
};

// Logger
const logger = {
  info: (message) => console.log(chalk.blue(`[INFO] ${message}`)),
  success: (message) => console.log(chalk.green(`[SUCCESS] ${message}`)),
  error: (message) => console.log(chalk.red(`[ERROR] ${message}`)),
  warn: (message) => console.log(chalk.yellow(`[WARNING] ${message}`)),
  header: (message) => console.log(chalk.magenta.bold(`\n=== ${message} ===`))
};

// Helper function to test an endpoint
async function testEndpoint(baseUrl, endpoint, authCookie = null) {
  const url = `${baseUrl}${endpoint.path}`;
  
  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (authCookie) {
      options.headers.Cookie = authCookie;
    }
    
    if (endpoint.method === 'POST') {
      options.body = JSON.stringify({});
    }
    
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      success: response.ok
    };
  } catch (error) {
    return {
      error: error.message,
      success: false
    };
  }
}

// Helper function to log comparison
function logComparison(local, production, endpoint) {
  logger.info(`Endpoint: ${endpoint.method} ${endpoint.path}`);
  
  if (local.success && production.success) {
    logger.success('Both environments returned success responses');
    
    if (local.status === production.status) {
      logger.success(`Matching status codes: ${local.status}`);
    } else {
      logger.warn(`Different status codes: Local ${local.status}, Production ${production.status}`);
    }
    
    // Only compare if both responses are JSON
    if (typeof local.data === 'object' && typeof production.data === 'object') {
      const localKeys = Object.keys(local.data).sort();
      const productionKeys = Object.keys(production.data).sort();
      
      if (JSON.stringify(localKeys) === JSON.stringify(productionKeys)) {
        logger.success('Response structure matches');
      } else {
        logger.warn('Response structure differs:');
        logger.info(`Local keys: ${localKeys.join(', ')}`);
        logger.info(`Production keys: ${productionKeys.join(', ')}`);
      }
    }
  } else if (!local.success && !production.success) {
    logger.warn('Both environments returned error responses');
    logger.info(`Local error: ${local.error || local.status}`);
    logger.info(`Production error: ${production.error || production.status}`);
  } else if (local.success) {
    logger.error('Local works but production failed');
    logger.info(`Local status: ${local.status}`);
    logger.info(`Production error: ${production.error || production.status}`);
  } else {
    logger.error('Production works but local failed');
    logger.info(`Local error: ${local.error || local.status}`);
    logger.info(`Production status: ${production.status}`);
  }
  
  console.log(''); // Empty line for spacing
}

// Helper function to get authentication cookie
async function getAuthCookie(baseUrl) {
  try {
    // Login to get auth cookie
    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config.auth)
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}`);
    }
    
    // Extract the cookie
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (!cookies) {
      throw new Error('No authentication cookie was returned');
    }
    
    // Parse the cookie - typically we need connect.sid for Express sessions
    const sessionCookie = cookies.split(';')[0];
    
    return sessionCookie;
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return null;
  }
}

// Main test function
async function runTests() {
  logger.header('ChickFarms Spin API Deployment Test');
  
  // Get auth cookie for local environment
  logger.info('Authenticating with local environment...');
  const localAuthCookie = await getAuthCookie(config.localBaseUrl);
  
  if (!localAuthCookie) {
    logger.error('Failed to authenticate with local environment. Tests cannot continue.');
    return;
  }
  
  // Get auth cookie for production environment if available
  let productionAuthCookie = null;
  if (config.productionBaseUrl) {
    logger.info('Authenticating with production environment...');
    productionAuthCookie = await getAuthCookie(config.productionBaseUrl);
    
    if (!productionAuthCookie) {
      logger.warn('Failed to authenticate with production environment. Will test without authentication.');
    }
  }
  
  // Test each endpoint
  for (const endpoint of config.endpoints) {
    logger.header(`Testing ${endpoint.method} ${endpoint.path}`);
    logger.info(endpoint.description);
    
    // Test local environment
    logger.info('Testing local environment...');
    const localResult = await testEndpoint(config.localBaseUrl, endpoint, localAuthCookie);
    
    if (localResult.success) {
      logger.success(`Local test passed: ${localResult.status}`);
    } else {
      logger.error(`Local test failed: ${localResult.error || localResult.status}`);
    }
    
    // If production URL is provided, test it too
    if (config.productionBaseUrl) {
      logger.info('Testing production environment...');
      const productionResult = await testEndpoint(
        config.productionBaseUrl, 
        endpoint, 
        productionAuthCookie
      );
      
      if (productionResult.success) {
        logger.success(`Production test passed: ${productionResult.status}`);
      } else {
        logger.error(`Production test failed: ${productionResult.error || productionResult.status}`);
      }
      
      // Compare results
      logger.header('Comparing Environments');
      logComparison(localResult, productionResult, endpoint);
    }
  }
  
  logger.header('Test Summary');
  logger.info('Tests completed. Check the logs above for any issues.');
  
  if (!config.productionBaseUrl) {
    logger.warn('Production URL not provided. Only local tests were performed.');
    logger.info('To test against production, set the PRODUCTION_URL environment variable.');
  }
}

// Run the tests
runTests().catch(error => {
  logger.error(`Unhandled error: ${error.message}`);
  process.exit(1);
});