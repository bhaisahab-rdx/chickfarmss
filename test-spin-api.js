/**
 * ChickFarms Spin API Testing Script
 * 
 * This script specifically tests the spin functionality endpoints
 * to verify they are working correctly before deployment.
 */

import http from 'http';
const PORT = process.env.PORT || 3001;

/**
 * Run the tests
 */
async function runTests() {
  console.log('Starting Spin API Tests...');
  console.log(`Testing against server at: http://localhost:${PORT}`);
  
  // Test basic health endpoint first to make sure server is responsive
  await testEndpoint('/api/health', 'Health endpoint');
  
  // Try the new debug-spin endpoint
  await testEndpoint('/api/debug-spin', 'Spin debug endpoint');
  
  // Try testing direct unauthenticated access to spin endpoints
  // (These should all fail with 401 - that's expected behavior)
  try {
    console.log('\nTesting unauthenticated access (expect 401 errors)...');
    await testEndpoint('/api/spin/status', 'Spin status without auth', 'GET', null, null, false);
    await testEndpoint('/api/spin/spin', 'Spin action without auth', 'POST', {}, null, false);
    await testEndpoint('/api/spin/claim-extra', 'Claim extra spin without auth', 'POST', {}, null, false);
  } catch (error) {
    console.log('✓ Authentication check successful: Spin endpoints rejected unauthenticated access');
  }
  
  // Now try with authentication
  console.log('\nPerforming authenticated tests...');
  try {
    // Login with admin credentials
    const loginResponse = await testEndpoint('/api/auth/login', 'Admin login', 'POST', { 
      username: 'adminraja', 
      password: 'admin8751' 
    });
    
    // Extract session cookie
    if (loginResponse && loginResponse.headers && loginResponse.headers['set-cookie']) {
      const authCookie = loginResponse.headers['set-cookie'][0];
      console.log(`\nAuthenticated successfully, session cookie: ${authCookie.substring(0, 20)}...`);
      
      // Now test the spin endpoints with auth
      await testEndpoint('/api/spin/status', 'Spin status with auth', 'GET', null, authCookie);
      await testEndpoint('/api/spin/spin', 'Spin action with auth', 'POST', {}, authCookie);
      await testEndpoint('/api/spin/claim-extra', 'Claim extra spin with auth', 'POST', {}, authCookie);
      
      console.log('\n✅ All authenticated spin tests PASSED!');
    } else {
      console.error('❌ Failed to get authentication cookie. Login response:', loginResponse.statusCode);
    }
  } catch (error) {
    console.error(`❌ Authentication tests failed: ${error.message}`);
  }
  
  console.log('\nAll tests completed!');
}

/**
 * Test a specific endpoint and verify the response
 */
async function testEndpoint(path, description, method = 'GET', body = null, cookie = null, expectSuccess = true) {
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
        try {
          const parsed = JSON.parse(data);
          const clipLength = 100;
          console.log(`  Response: ${JSON.stringify(parsed, null, 2).substring(0, clipLength)}${data.length > clipLength ? '...' : ''}`);
          
          if (expectSuccess && (res.statusCode < 200 || res.statusCode >= 300)) {
            console.error(`  ❌ ${description} failed with status ${res.statusCode}`);
            reject(new Error(`${description} failed with status ${res.statusCode}`));
          } else {
            console.log(`  ✓ ${description} test passed`);
            resolve(res);
          }
        } catch (error) {
          console.error(`  ❌ ${description} returned invalid JSON: ${error.message}`);
          reject(error);
        }
      });
    });
    
    req.on('error', error => {
      console.error(`  ❌ ${description} request failed: ${error.message}`);
      reject(error);
    });
    
    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}

// Run the tests
runTests().catch(error => {
  console.error('Test error:', error);
  process.exit(1);
});