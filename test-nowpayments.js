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
async function getMinimumPaymentAmount(currency = 'USDTTRC20') {
  try {
    console.log(`Getting minimum payment amount for currency: ${currency}`);
    
    // The API requires both currency_from and currency_to parameters
    // NOWPayments needs to know what currency you're converting from and to
    const response = await axios.get(
      `${API_BASE_URL}/min-amount?currency_from=${currency}&currency_to=usd`,
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
    console.error(`Error getting minimum payment amount for ${currency}:`);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    
    // Try with a different approach if the first attempt failed
    try {
      console.log(`Retrying with different parameters for currency: ${currency}`);
      
      // Try with both parameters explicitly set
      const retryResponse = await axios.get(
        `${API_BASE_URL}/min-amount/${currency}?currency_to=usd`,
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log(`Retry successful - Minimum payment amount:`, retryResponse.data);
      return retryResponse.data;
    } catch (retryError) {
      console.error(`Retry also failed for ${currency}:`);
      if (retryError.response) {
        console.error('Retry response data:', retryError.response.data);
        console.error('Retry response status:', retryError.response.status);
      }
      throw error; // Throw the original error
    }
  }
}

// Function to create invoice
async function createInvoice(amount) {
  try {
    const payload = {
      price_amount: amount,
      price_currency: 'USD',
      pay_currency: 'USDTTRC20', // Explicitly specify USDT on Tron network
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
      invoice_url: response.data.invoice_url,
      pay_currency: response.data.pay_currency || 'Not specified in response'
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
    
    // If USDTTRC20 fails, try without specifying the currency
    try {
      console.log('USDTTRC20 invoice failed, trying without specifying pay_currency...');
      const fallbackPayload = {
        price_amount: amount,
        price_currency: 'USD',
        ipn_callback_url: 'https://chickfarms.replit.app/api/payments/callback',
        success_url: 'https://chickfarms.replit.app/wallet?payment=success',
        cancel_url: 'https://chickfarms.replit.app/wallet?payment=cancelled',
        is_fee_paid_by_user: true
      };
      
      const fallbackResponse = await axios.post(
        `${API_BASE_URL}/invoice`,
        fallbackPayload,
        { 
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          }
        }
      );
      
      console.log('Successfully created fallback NOWPayments invoice:', {
        id: fallbackResponse.data.id,
        status: fallbackResponse.data.status,
        invoice_url: fallbackResponse.data.invoice_url
      });
      
      return fallbackResponse.data;
    } catch (fallbackError) {
      console.error('Fallback invoice creation also failed:', fallbackError.message);
      throw error; // Throw the original error
    }
  }
}

// Run the tests
async function runTests() {
  try {
    // Step 1: Check API status
    await checkStatus();
    
    // Step 2: Try to get minimum payment amount for USDTTRC20
    try {
      console.log('Testing USDTTRC20 as primary payment currency...');
      await getMinimumPaymentAmount('USDTTRC20');
    } catch (usdtTrc20Error) {
      console.log('USDTTRC20 not available, trying regular USDT...');
      try {
        await getMinimumPaymentAmount('USDT');
      } catch (usdtError) {
        console.log('USDT also not available, trying alternative currencies...');
        try {
          await getMinimumPaymentAmount('BTC');
        } catch (btcError) {
          console.log('Trying another alternative currency (ETH)...');
          try {
            await getMinimumPaymentAmount('ETH');
          } catch (ethError) {
            console.error('All cryptocurrency checks failed. Proceeding with default values.');
          }
        }
      }
    }
    
    // Step 3: Create an invoice with default settings
    // The system should attempt to use USDTTRC20 first based on our settings
    console.log('Creating payment invoice (should prefer USDTTRC20 when available)');
    await createInvoice(10);
  } catch (error) {
    console.error('Test failed with error:', error.message);
  }
}

runTests();