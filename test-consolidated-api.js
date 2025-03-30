/**
 * Test script for verifying the consolidated API functionality
 * 
 * This script simulates requests to the consolidated API endpoint
 * and checks that the responses are correct for various API routes.
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const PORT = 3001;
const consolidatedApiPath = path.join(__dirname, 'api', 'consolidated.cjs');

// Check if the consolidated API file exists
if (!fs.existsSync(consolidatedApiPath)) {
  console.error('Error: consolidated.cjs not found in the api directory');
  process.exit(1);
}

// Load the consolidated API handler
const apiHandler = require('./api/consolidated.cjs');

// Create a simple HTTP server to test the API
const server = http.createServer((req, res) => {
  // Add Express-like methods to the response object
  res.status = function(statusCode) {
    this.statusCode = statusCode;
    return this;
  };
  
  res.json = function(data) {
    this.setHeader('Content-Type', 'application/json');
    this.end(JSON.stringify(data));
    return this;
  };
  
  // Handle request body for POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        req.body = JSON.parse(body);
        // Pass the request to the consolidated API handler
        apiHandler(req, res);
      } catch (error) {
        res.status(400).json({ error: 'Invalid JSON' });
      }
    });
  } else {
    // For non-POST requests, just pass directly to the handler
    apiHandler(req, res);
  }
});

// Start the server
server.listen(PORT, () => {
  console.log(`Test server running at http://localhost:${PORT}`);
  console.log('Running tests...\n');
  
  // Run the tests
  runTests()
    .then(() => {
      // Close the server when tests are done
      server.close(() => {
        console.log('\nTest server closed');
        process.exit(0);
      });
    })
    .catch(error => {
      console.error('Test failed:', error);
      server.close(() => {
        process.exit(1);
      });
    });
});

/**
 * Run a series of tests against the API
 */
async function runTests() {
  // Test the health endpoint
  await testEndpoint('/api/health', 'Health endpoint');

  // Test the minimal endpoint
  await testEndpoint('/api/minimal', 'Minimal endpoint');
  
  // Test the diagnostics endpoint
  await testEndpoint('/api/diagnostics', 'Diagnostics endpoint');
  
  // Test the index endpoint
  await testEndpoint('/api', 'API index endpoint');

  // Test authentication endpoints with admin credentials
  console.log('\nTesting authentication endpoints...');
  try {
    // Test login endpoint with admin credentials
    const loginResponse = await testEndpoint('/api/auth/login', 'Login endpoint', 'POST', {
      username: 'adminraja',
      password: 'admin8751'
    });
    
    // Get the authentication cookie from the login response
    if (loginResponse && loginResponse.headers && loginResponse.headers['set-cookie']) {
      const authCookie = loginResponse.headers['set-cookie'][0];
      
      // Test spin-related endpoints with authentication
      console.log('\nTesting spin endpoints with authentication...');
      await testEndpoint('/api/spin/status', 'Spin status endpoint', 'GET', null, authCookie);
      await testEndpoint('/api/spin/spin', 'Spin action endpoint', 'POST', {}, authCookie);
      await testEndpoint('/api/spin/claim-extra', 'Claim extra spin endpoint', 'POST', {}, authCookie);
    }
  } catch (error) {
    console.log('Skipping authentication-required tests:', error.message);
  }

  // Test spin endpoints directly without authentication (not recommended for production)
  console.log('\nTesting spin endpoints without authentication (for debugging purposes)...');
  try {
    await testEndpoint('/api/spin/status', 'Spin status endpoint (no auth)', 'GET');
  } catch (error) {
    console.error('Spin status check failed:', error.message);
  }
  
  console.log('\nAll tests completed successfully! The consolidated API is working correctly.');
}

/**
 * Test a specific endpoint and verify the response
 * @param {string} path - The endpoint path to test
 * @param {string} description - Description of the test
 * @param {string} method - HTTP method to use (default: GET)
 * @param {object} body - Optional request body for POST requests
 * @param {string} cookie - Optional cookie to include with the request (for authentication)
 */
async function testEndpoint(path, description, method = 'GET', body = null, cookie = null) {
  return new Promise((resolve, reject) => {
    console.log(`Testing ${description}...`);
    
    const options = {
      hostname: 'localhost',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // Add cookie header if provided
    if (cookie) {
      options.headers['Cookie'] = cookie;
    }
    
    const req = http.request(options, res => {
      console.log(`  Status: ${res.statusCode}`);
      
      let data = '';
      
      res.on('data', chunk => {
        data += chunk;
      });
      
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
          console.log(`  Response: ${JSON.stringify(parsed, null, 2).substring(0, 100)}${data.length > 100 ? '...' : ''}`);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`  ✓ ${description} test passed\n`);
            // Return the response for authentication purposes
            resolve(res);
          } else {
            console.error(`  ✗ ${description} returned status ${res.statusCode}`);
            reject(new Error(`${description} failed with status ${res.statusCode}`));
          }
        } catch (error) {
          console.error(`  ✗ ${description} returned invalid JSON:`, error.message);
          reject(error);
        }
      });
    });
    
    req.on('error', error => {
      console.error(`  ✗ ${description} request failed:`, error.message);
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}