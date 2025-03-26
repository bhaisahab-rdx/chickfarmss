/**
 * Test script to verify the end-to-end payment flow in ChickFarms
 * This script logs in and creates a test invoice to verify NOWPayments integration
 */

import axios from 'axios';
const API_BASE = 'http://localhost:5000';

// Test user credentials (use admin for testing)
const TEST_USER = {
  username: 'adminraja',
  password: 'admin123'
};

// Amount to deposit (in USD)
const DEPOSIT_AMOUNT = 10;

async function runTest() {
  try {
    console.log('=== ChickFarms Payment Integration Test ===');
    console.log(`Testing with user: ${TEST_USER.username}`);
    
    // Step 1: Check if payment service is available
    console.log('\n1. Checking payment service status...');
    const statusResponse = await axios.get(`${API_BASE}/api/payments/status`);
    console.log('Payment service status:', statusResponse.data);
    
    if (!statusResponse.data.apiKeyConfigured) {
      throw new Error('NOWPayments API key is not configured');
    }
    
    // Step 2: Login to get session cookie
    console.log('\n2. Logging in to get authenticated session...');
    const loginResponse = await axios.post(
      `${API_BASE}/api/login`,
      TEST_USER,
      { withCredentials: true }
    );
    
    if (!loginResponse.data || !loginResponse.data.id) {
      throw new Error('Login failed');
    }
    
    console.log('Login successful. User ID:', loginResponse.data.id);
    
    // Extract session cookie
    const cookies = loginResponse.headers['set-cookie'];
    if (!cookies || cookies.length === 0) {
      throw new Error('No session cookie received');
    }
    
    // Extract just the session cookie we need
    const sessionCookie = cookies[0].split(';')[0];
    console.log('Using session cookie:', sessionCookie);
    
    // Step 3: Create a payment invoice
    console.log(`\n3. Creating payment invoice for $${DEPOSIT_AMOUNT}...`);
    const invoiceResponse = await axios.post(
      `${API_BASE}/api/payments/create-invoice`,
      { amount: DEPOSIT_AMOUNT, currency: 'USD' },
      { 
        headers: { Cookie: sessionCookie },
        withCredentials: true
      }
    );
    
    console.log('Invoice creation response:', JSON.stringify(invoiceResponse.data, null, 2));
    
    if (!invoiceResponse.data.invoiceUrl) {
      throw new Error('No invoice URL in response');
    }
    
    console.log('\n=== Test completed successfully ===');
    console.log('Invoice URL:', invoiceResponse.data.invoiceUrl);
    console.log('Invoice ID:', invoiceResponse.data.invoiceId);
    
  } catch (error) {
    console.error('\n❌ TEST FAILED');
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
runTest();