// Test script for NOWPayments API
import axios from 'axios';
import 'dotenv/config';

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;

// Function to check NOWPayments status
async function checkStatus() {
  try {
    console.log('Checking NOWPayments API status...');
    console.log('API Key present:', !!API_KEY);
    
    const response = await axios.get(`${API_BASE_URL}/status`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Status API Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking NOWPayments status:');
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

// Function to get minimum payment amount
async function getMinimumPaymentAmount(currency = 'USDT') {
  try {
    console.log(`Getting minimum payment amount for currency: ${currency}`);
    
    const response = await axios.get(
      `${API_BASE_URL}/min-amount?currency_from=${currency}`,
      { 
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log(`Minimum payment amount response:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error getting minimum payment amount:`);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

// Function to create invoice
async function createInvoice(amount) {
  try {
    const payload = {
      price_amount: amount,
      price_currency: 'USD',
      ipn_callback_url: 'https://chickfarms.replit.app/api/payments/callback',
      success_url: 'https://chickfarms.replit.app/wallet?payment=success',
      cancel_url: 'https://chickfarms.replit.app/wallet?payment=cancelled',
      is_fee_paid_by_user: true
    };

    console.log('Creating NOWPayments invoice with payload:', {
      ...payload,
      api_key: '[REDACTED]'
    });

    const response = await axios.post(
      `${API_BASE_URL}/invoice`,
      payload,
      { 
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('Successfully created NOWPayments invoice:', {
      id: response.data.id,
      status: response.data.status,
      invoice_url: response.data.invoice_url
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating NOWPayments invoice:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    throw error;
  }
}

// Run the tests
async function runTests() {
  try {
    await checkStatus();
    await getMinimumPaymentAmount('USDT');
    await createInvoice(10);
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

runTests();