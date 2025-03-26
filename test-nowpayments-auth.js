/**
 * Test script to verify NOWPayments JWT authentication flow
 * Run this script to test the JWT auth flow with NOWPayments
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const EMAIL = process.env.NOWPAYMENTS_EMAIL;
const PASSWORD = process.env.NOWPAYMENTS_PASSWORD;

async function testAuth() {
  console.log('NOWPayments JWT Authentication Test');
  console.log('----------------------------------');
  
  if (!API_KEY) {
    console.error('❌ NOWPAYMENTS_API_KEY is not set in environment variables');
    return false;
  }
  
  if (!EMAIL) {
    console.error('❌ NOWPAYMENTS_EMAIL is not set in environment variables');
    return false;
  }
  
  if (!PASSWORD) {
    console.error('❌ NOWPAYMENTS_PASSWORD is not set in environment variables');
    return false;
  }
  
  console.log('✓ API Key is configured');
  console.log(`✓ Using email: ${EMAIL}`);
  console.log(`API Key starts with: ${API_KEY.substring(0, 4)}...`);
  
  try {
    console.log('\nStep 1: Authenticating with email and password...');
    const authResponse = await axios.post(
      `${API_BASE_URL}/auth`, 
      { 
        email: EMAIL,
        password: PASSWORD
      }, 
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );
    
    console.log('✓ Authentication response:', authResponse.data);
    
    if (authResponse.data && authResponse.data.token) {
      const jwtToken = authResponse.data.token;
      console.log('✓ Received JWT token');
      
      // Test the JWT token with a simple API call like status
      console.log('\nStep 2: Testing JWT token with status endpoint...');
      const statusResponse = await axios.get(
        `${API_BASE_URL}/status`, 
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          timeout: 30000
        }
      );
      
      console.log('✓ Status endpoint response with JWT:', statusResponse.data);
      
      // Test a previously failing endpoint like currencies
      console.log('\nStep 3: Testing JWT token with currencies endpoint...');
      const currenciesResponse = await axios.get(
        `${API_BASE_URL}/currencies`, 
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwtToken}`
          },
          timeout: 30000
        }
      );
      
      const currencies = currenciesResponse.data.currencies || [];
      console.log(`✓ Successfully retrieved ${currencies.length} currencies with JWT`);
      
      // Print example headers for integration
      console.log('\n=== Integration Example Headers ===');
      console.log('Copy these headers for your integration:');
      console.log(`'x-api-key': '${API_KEY.substring(0, 4)}...'`);
      console.log(`'Authorization': 'Bearer ${jwtToken.substring(0, 15)}...'`);
      
      return true;
    } else {
      console.error('❌ No token received in authentication response');
      console.log('Raw response:', authResponse.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Authentication Test Failed');
    console.error('Error message:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Network error or API endpoint unreachable.');
    }
    
    return false;
  }
}

// Run the test immediately when the script is executed
testAuth().catch(console.error);