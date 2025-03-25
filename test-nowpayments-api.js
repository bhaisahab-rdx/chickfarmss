// Simple script to test NOWPayments API directly
import axios from 'axios';
import { config } from './server/config.js';

// NOWPayments API key from configuration
const API_KEY = config.nowpayments.apiKey;
const API_BASE_URL = 'https://api.nowpayments.io/v1';

async function testNowPaymentsAPI() {
  console.log('NOWPayments API Key available:', !!API_KEY);
  
  try {
    // 1. Test API status
    console.log('\n1. Testing API status...');
    const statusResponse = await axios.get(`${API_BASE_URL}/status`, {
      headers: {
        'x-api-key': API_KEY
      }
    });
    
    console.log('Status response:', statusResponse.data);
    
    // 2. Test creating an invoice with required parameters
    console.log('\n2. Testing create invoice...');
    const invoicePayload = {
      price_amount: 10,
      price_currency: 'USD',
      order_id: `TEST-${Date.now()}`,
      order_description: 'Test invoice from API script',
      ipn_callback_url: 'https://chickfarms.replit.app/api/payments/callback',
      success_url: 'https://chickfarms.replit.app/wallet?payment=success',
      cancel_url: 'https://chickfarms.replit.app/wallet?payment=cancelled',
      is_fee_paid_by_user: true
    };
    
    console.log('Invoice payload:', invoicePayload);
    
    const invoiceResponse = await axios.post(
      `${API_BASE_URL}/invoice`, 
      invoicePayload,
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Invoice created successfully:');
    console.log('- Invoice ID:', invoiceResponse.data.id);
    console.log('- Invoice URL:', invoiceResponse.data.invoice_url);
    console.log('- Status:', invoiceResponse.data.status);
    
  } catch (error) {
    console.error('API test failed:');
    
    if (error.response) {
      // The API responded with an error status code
      console.error('Status code:', error.response.status);
      console.error('Error data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something else caused the error
      console.error('Error message:', error.message);
    }
  }
}

// Run the test
testNowPaymentsAPI();