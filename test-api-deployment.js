/**
 * ChickFarms API Deployment Test Script
 * 
 * This script runs the test-deployment.js API endpoint directly
 * to verify your Vercel deployment configuration without a server.
 */

import http from 'http';
import { execSync } from 'child_process';

// Set environment variables for testing
process.env.NODE_ENV = 'production';

// Create a mock Express request/response
const mockReq = {
  headers: {
    host: 'localhost',
    'user-agent': 'ChickFarms-Test-Script',
  },
  protocol: 'http',
  get: (header) => {
    return mockReq.headers[header.toLowerCase()];
  }
};

const mockRes = {
  status: (code) => {
    mockRes.statusCode = code;
    return mockRes;
  },
  json: (data) => {
    console.log(JSON.stringify(data, null, 2));
    mockRes.jsonSent = true;
    mockRes.data = data;
  },
  header: (name, value) => {
    return mockRes;
  },
  headersSent: false,
  statusCode: 200,
  jsonSent: false,
  data: null
};

async function runTest() {
  try {
    console.log('Starting API deployment test...\n');
    
    // Import the test deployment handler
    const { default: testDeployment } = await import('./api/test-deployment.js');
    
    // Run the test with mock req/res
    await testDeployment(mockReq, mockRes);
    
    // Check results
    if (mockRes.jsonSent) {
      const results = mockRes.data;
      
      console.log('\n===== Test Results Summary =====');
      console.log(`Status: ${results.success ? 'SUCCESS' : 'FAILURE'}`);
      console.log(`Environment: ${results.environment}`);
      console.log(`Tests: ${results.summary.passed} passed, ${results.summary.failed} failed`);
      console.log('===============================\n');
      
      // Return appropriate exit code
      process.exit(results.success ? 0 : 1);
    } else {
      console.error('Test did not return a valid response');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test execution failed:', error);
    process.exit(1);
  }
}

runTest();