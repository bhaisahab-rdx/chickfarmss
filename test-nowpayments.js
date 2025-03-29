// Test script for NOWPayments API integration
import axios from 'axios';

async function testNOWPaymentsAPI() {
  try {
    const apiKey = process.env.NOWPAYMENTS_API_KEY;
    
    if (!apiKey) {
      console.error('NOWPAYMENTS_API_KEY is not set in environment variables');
      process.exit(1);
    }
    
    console.log('Testing NOWPayments API...');
    
    // Test API status
    const statusResponse = await axios.get('https://api.nowpayments.io/v1/status', {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status API Response:', statusResponse.data);
    
    // Test minimum payment amount for USDT TRC20
    try {
      const minAmountResponse = await axios.get('https://api.nowpayments.io/v1/estimate?amount=10&currency_from=usd&currency_to=usdttrc20', {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('USDT TRC20 Estimate Response:', minAmountResponse.data);
    } catch (error) {
      console.error('Error getting USDT TRC20 estimate:', error.response?.data || error.message);
    }
    
    // Test available currencies
    try {
      const currenciesResponse = await axios.get('https://api.nowpayments.io/v1/currencies', {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Currencies Response:', currenciesResponse.data);
      
      // Check if USDTTRC20 is available
      const currencies = currenciesResponse.data.currencies || [];
      const hasUSDTTRC20 = currencies.includes('usdttrc20');
      console.log('USDTTRC20 Available:', hasUSDTTRC20);
    } catch (error) {
      console.error('Error getting currencies:', error.response?.data || error.message);
    }
    
    // Test payment status (using our recent payment ID)
    try {
      const paymentId = '5700771514'; // Use the payment ID from our transaction
      const paymentStatusResponse = await axios.get(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Payment Status Response:', paymentStatusResponse.data);
    } catch (error) {
      console.error('Error getting payment status:', error.response?.data || error.message);
    }
    
    console.log('NOWPayments API test completed.');
  } catch (error) {
    console.error('Error testing NOWPayments API:', error.message);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testNOWPaymentsAPI();