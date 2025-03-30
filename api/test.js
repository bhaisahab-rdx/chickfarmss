// Test script for standalone API testing
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration
const PORT = process.env.PORT || 4000;
const API_BASE = `http://localhost:${PORT}`;
const TEST_TIMEOUT = 30000; // 30 seconds

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Test suite
async function runTests() {
  const server = spawn('node', ['api/server.js'], {
    stdio: ['ignore', 'pipe', 'pipe']
  });
  
  let serverStarted = false;
  
  // Handle server output
  server.stdout.on('data', (data) => {
    const output = data.toString().trim();
    console.log(`${colors.blue}[Server]:${colors.reset} ${output}`);
    
    if (output.includes('API test server running')) {
      serverStarted = true;
      console.log(`${colors.green}[Test]:${colors.reset} Server started successfully`);
      runTestSuite();
    }
  });
  
  server.stderr.on('data', (data) => {
    console.error(`${colors.red}[Server Error]:${colors.reset} ${data.toString().trim()}`);
  });
  
  // Set timeout to kill server if it doesn't start
  const startTimeout = setTimeout(() => {
    if (!serverStarted) {
      console.error(`${colors.red}[Test]:${colors.reset} Server failed to start within ${TEST_TIMEOUT/1000} seconds`);
      server.kill();
      process.exit(1);
    }
  }, TEST_TIMEOUT);
  
  // Function to run all tests
  async function runTestSuite() {
    clearTimeout(startTimeout);
    
    console.log(`${colors.magenta}[Test]:${colors.reset} Starting test suite`);
    
    try {
      // Test 1: Root endpoint
      await testEndpoint('/', 'Root endpoint');
      
      // Test 2: Health check
      await testEndpoint('/api/health', 'Health check');
      
      // Test 3: Minimal API
      await testEndpoint('/api/minimal', 'Minimal API');
      
      // Test 4: Database test only if DATABASE_URL is set
      if (process.env.DATABASE_URL) {
        await testEndpoint('/api/db-test', 'Database test');
        await testEndpoint('/api/pooled-test', 'Connection pooling test');
      } else {
        console.log(`${colors.yellow}[Test]:${colors.reset} Skipping database tests because DATABASE_URL is not set`);
      }
      
      // Test 5: Diagnostics
      await testEndpoint('/api/diagnostics', 'Diagnostics');
      
      console.log(`${colors.green}[Test]:${colors.reset} All tests completed successfully`);
    } catch (error) {
      console.error(`${colors.red}[Test Error]:${colors.reset} ${error.message}`);
    } finally {
      // Clean up
      console.log(`${colors.magenta}[Test]:${colors.reset} Shutting down server`);
      server.kill();
      process.exit(0);
    }
  }
  
  // Helper function to test an endpoint
  async function testEndpoint(path, description) {
    console.log(`${colors.cyan}[Test]:${colors.reset} Testing ${description}`);
    
    try {
      const response = await fetch(`${API_BASE}${path}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`${colors.green}[Test]:${colors.reset} ${description} - Success (${response.status})`);
        console.log(`${colors.cyan}[Test]:${colors.reset} ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.error(`${colors.red}[Test]:${colors.reset} ${description} - Failed with status ${response.status}`);
        console.error(`${colors.red}[Test]:${colors.reset} ${JSON.stringify(data)}`);
        throw new Error(`${description} test failed`);
      }
    } catch (error) {
      console.error(`${colors.red}[Test]:${colors.reset} ${description} - Exception: ${error.message}`);
      throw error;
    }
  }
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log(`${colors.magenta}[Test]:${colors.reset} Received SIGINT, shutting down`);
    server.kill();
    process.exit(0);
  });
}

// Run the tests
runTests();