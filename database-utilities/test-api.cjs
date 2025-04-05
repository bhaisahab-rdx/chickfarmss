// Test script for NOWPayments API
const axios = require('axios');
require('dotenv').config();

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;

console.log('NOWPayments API testing');
console.log('API Key available:', !!API_KEY);

// Test the status endpoint
async function testStatus() {
  try {
    const response = await axios.get(`${API_BASE_URL}/status`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Status API Response:', response.data);
    return true;
  } catch (error) {
    console.error('Error checking NOWPayments status:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
    return false;
  }
}

// Test creating an invoice
async function testCreateInvoice() {
  try {
    console.log('Testing invoice creation...');
    
    const payload = {
      price_amount: 10,
      price_currency: 'USD',
      pay_currency: 'USDTTRC20',
      ipn_callback_url: 'https://chickfarms.replit.app/api/payments/callback',
      success_url: 'https://chickfarms.replit.app/wallet?payment=success',
      cancel_url: 'https://chickfarms.replit.app/wallet?payment=cancelled',
      is_fee_paid_by_user: true,
      order_id: `TEST-${Date.now()}`,
      order_description: 'Test invoice from API testing script'
    };
    
    console.log('Invoice payload:', {
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
    
    console.log('Invoice created successfully!');
    console.log('Invoice ID:', response.data.id);
    console.log('Invoice URL:', response.data.invoice_url);
    return response.data;
  } catch (error) {
    console.error('Error creating invoice:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }
    return null;
  }
}

// Test available currencies
async function testAvailableCurrencies() {
  try {
    console.log('Checking available currencies...');
    
    const response = await axios.get(
      `${API_BASE_URL}/currencies`,
      {
        headers: {
          'x-api-key': API_KEY,
          'Content-Type': 'application/json',
        }
      }
    );
    
    console.log('Available currencies:');
    const currencies = response.data.currencies || [];
    
    // Filter to find USDT specifically
    const usdtCurrencies = currencies.filter(currency => 
      currency.currency.includes('USDT') || currency.currency.includes('Tether')
    );
    
    if (usdtCurrencies.length > 0) {
      console.log('USDT options available:');
      usdtCurrencies.forEach(currency => {
        console.log(`- ${currency.currency} (${currency.network}): Enabled = ${currency.enabled}`);
      });
    } else {
      console.log('No USDT options found in available currencies');
    }
    
    // List all available currencies
    console.log('\nAll available currencies:');
    currencies.filter(c => c.enabled).forEach(currency => {
      console.log(`- ${currency.currency} (${currency.network})`);
    });
    
    return currencies;
  } catch (error) {
    console.error('Error getting available currencies:');
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else {
      console.error('Error:', error.message);
    }
    return [];
  }
}

// Run all tests
async function runTests() {
  const statusOk = await testStatus();
  if (statusOk) {
    const currencies = await testAvailableCurrencies();
    
    // If we have available currencies, try to create an invoice with a valid one
    if (currencies.length > 0) {
      // Find the first enabled currency
      const validCurrency = currencies.find(c => c.enabled);
      
      if (validCurrency) {
        console.log(`\nTrying to create invoice with available currency: ${validCurrency.currency}`);
        
        const modifiedPayload = {
          price_amount: 10,
          price_currency: 'USD',
          pay_currency: validCurrency.currency,
          ipn_callback_url: 'https://chickfarms.replit.app/api/payments/callback',
          success_url: 'https://chickfarms.replit.app/wallet?payment=success',
          cancel_url: 'https://chickfarms.replit.app/wallet?payment=cancelled',
          is_fee_paid_by_user: true,
          order_id: `TEST-${Date.now()}`,
          order_description: 'Test invoice from API testing script'
        };
        
        try {
          console.log('Modified invoice payload:', {
            ...modifiedPayload,
            api_key: '[REDACTED]'
          });
          
          const response = await axios.post(
            `${API_BASE_URL}/invoice`,
            modifiedPayload,
            {
              headers: {
                'x-api-key': API_KEY,
                'Content-Type': 'application/json',
              }
            }
          );
          
          console.log('Invoice created successfully!');
          console.log('Invoice ID:', response.data.id);
          console.log('Invoice URL:', response.data.invoice_url);
        } catch (error) {
          console.error('Error creating invoice with alternative currency:');
          if (error.response) {
            console.error('Response data:', error.response.data);
            console.error('Response status:', error.response.status);
          } else {
            console.error('Error:', error.message);
          }
        }
      }
    }
    
    // Still try the original USDT test for completeness
    await testCreateInvoice();
  }
}

runTests();