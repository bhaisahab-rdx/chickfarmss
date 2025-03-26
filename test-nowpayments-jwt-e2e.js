/**
 * Comprehensive E2E test for NOWPayments JWT authentication and invoice creation
 * This test verifies the complete flow from JWT authentication to invoice creation
 */
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.NOWPAYMENTS_API_KEY || 'MOCK_API_KEY';
const NOWPAYMENTS_EMAIL = process.env.NOWPAYMENTS_EMAIL || 'test@example.com';
const NOWPAYMENTS_PASSWORD = process.env.NOWPAYMENTS_PASSWORD || 'password';
const API_BASE_URL = 'https://api.nowpayments.io/v1';

async function testJWTAuthAndInvoiceCreation() {
  console.log('NOWPayments JWT Authentication and Invoice Creation Test');
  console.log('----------------------------------------------------');
  
  // Skip test if no API key or credentials
  if (!process.env.NOWPAYMENTS_API_KEY || !process.env.NOWPAYMENTS_EMAIL || !process.env.NOWPAYMENTS_PASSWORD) {
    console.log('⚠️ Missing API credentials - cannot run full test');
    console.log('To fully test JWT authentication and invoice creation, please set:');
    console.log('- NOWPAYMENTS_API_KEY');
    console.log('- NOWPAYMENTS_EMAIL');
    console.log('- NOWPAYMENTS_PASSWORD');
    return;
  }
  
  let jwtToken = null;
  
  try {
    // Step 1: Authenticate and get JWT token
    console.log('Step 1: Authenticating with NOWPayments API...');
    
    const authResponse = await axios.post(`${API_BASE_URL}/auth`, {
      email: NOWPAYMENTS_EMAIL,
      password: NOWPAYMENTS_PASSWORD
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    if (!authResponse.data || !authResponse.data.token) {
      console.log('❌ Authentication failed - no token received');
      console.log('Response:', authResponse.data);
      return;
    }
    
    jwtToken = authResponse.data.token;
    console.log('✓ Successfully obtained JWT token');
    
    // Step 2: Verify JWT token with status endpoint
    console.log('\nStep 2: Verifying JWT token with status endpoint...');
    const statusResponse = await axios.get(`${API_BASE_URL}/status`, {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (statusResponse.data && statusResponse.data.message === 'OK') {
      console.log('✓ Successfully verified JWT token with status endpoint');
    } else {
      console.log('❌ JWT token verification failed');
      console.log('Status:', statusResponse.data);
      return;
    }
    
    // Step 3: Get minimum payment amount
    console.log('\nStep 3: Getting minimum payment amount with JWT token...');
    try {
      const minAmountResponse = await axios.get(`${API_BASE_URL}/min-amount?currency_from=USDTTRC20&currency_to=usd`, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (minAmountResponse.data && minAmountResponse.data.min_amount !== undefined) {
        console.log('✓ Successfully retrieved minimum payment amount with JWT token');
        console.log('Minimum amount:', minAmountResponse.data.min_amount);
      } else {
        console.log('❌ Failed to retrieve minimum payment amount');
        console.log('Response:', minAmountResponse.data);
      }
    } catch (error) {
      console.log('❌ Error getting minimum payment amount: This is expected if your API key does not have this permission');
      console.log('Error:', error.response ? error.response.data : error.message);
      console.log('Proceeding with invoice creation anyway...');
    }
    
    // Step 4: Create invoice
    console.log('\nStep 4: Creating invoice with JWT token...');
    const invoicePayload = {
      price_amount: 10,
      price_currency: 'USD',
      pay_currency: 'USDTTRC20',
      ipn_callback_url: 'https://example.com/callback',
      order_id: `TEST-JWT-${Date.now()}`,
      order_description: 'Test invoice via JWT auth',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      is_fee_paid_by_user: true
    };
    
    try {
      const invoiceResponse = await axios.post(`${API_BASE_URL}/invoice`, invoicePayload, {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✓ Successfully created invoice with JWT authentication!');
      console.log('Invoice ID:', invoiceResponse.data.id);
      console.log('Invoice URL:', invoiceResponse.data.invoice_url);
      console.log('Invoice Status:', invoiceResponse.data.status);
    } catch (error) {
      console.log('❌ Failed to create invoice with JWT token');
      console.log('Error:', error.response ? error.response.data : error.message);
      
      if (error.response && error.response.status === 403) {
        console.log('This may indicate your account does not have permission to create invoices.');
        console.log('Please check your NOWPayments account permissions or upgrade your account if needed.');
      }
    }
    
    console.log('\nTest Summary:');
    console.log('✓ JWT authentication successful');
    console.log('✓ JWT token validation successful');
    
  } catch (error) {
    console.log('❌ Error during test:');
    
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
      
      if (error.response.status === 403) {
        console.log('\nThis appears to be a permissions issue with your NOWPayments account.');
        console.log('Possible solutions:');
        console.log('1. Ensure your API key is valid and has the correct permissions');
        console.log('2. Upgrade your NOWPayments account if you are using a free tier');
        console.log('3. Contact NOWPayments support to enable invoice creation for your account');
      }
    } else {
      console.log('Error:', error.message);
    }
  }
}

testJWTAuthAndInvoiceCreation();