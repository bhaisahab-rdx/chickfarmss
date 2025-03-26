/**
 * Test script to verify NowPayments API key and connectivity
 * Run this script directly with Node.js: node test-nowpayments-status.js
 */

import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();

const API_BASE_URL = 'https://api.nowpayments.io/v1';
const API_KEY = process.env.NOWPAYMENTS_API_KEY;

async function testApiConnection() {
  console.log('NowPayments API Connection Test');
  console.log('---------------------------------');
  
  if (!API_KEY) {
    console.error('❌ NOWPAYMENTS_API_KEY is not set in environment variables');
    return false;
  }
  
  console.log('✓ API Key is configured');
  console.log(`API Key starts with: ${API_KEY.substring(0, 4)}...`);
  
  try {
    console.log('\nTesting API connectivity...');
    console.log('Making request to /status endpoint');
    
    const statusResponse = await axios.get(`${API_BASE_URL}/status`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✓ Status endpoint response:', statusResponse.data);
    
    // Test currency endpoint
    console.log('\nTesting currency availability...');
    const currenciesResponse = await axios.get(`${API_BASE_URL}/currencies`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    const currencies = currenciesResponse.data.currencies || [];
    const enabledCurrencies = currencies.filter(c => c.enabled);
    
    console.log(`✓ Found ${enabledCurrencies.length} enabled currencies`);
    
    // Check for USDTTRC20 specifically
    const usdtTrc20 = enabledCurrencies.find(c => 
      c.currency.toUpperCase() === 'USDTTRC20' || 
      (c.currency.toUpperCase() === 'USDT' && c.network === 'TRC20')
    );
    
    if (usdtTrc20) {
      console.log('✓ USDT on TRC20 network is available');
      console.log(`  Min amount: ${usdtTrc20.min_amount}`);
      console.log(`  Max amount: ${usdtTrc20.max_amount}`);
    } else {
      console.log('❌ USDT on TRC20 network not found in available currencies');
      console.log('Available currencies:');
      enabledCurrencies.slice(0, 5).forEach(c => {
        console.log(`  - ${c.currency} ${c.network ? `(${c.network})` : ''}`);
      });
      if (enabledCurrencies.length > 5) {
        console.log(`  - ... and ${enabledCurrencies.length - 5} more`);
      }
    }
    
    // Test minimum payment amount endpoint
    console.log('\nTesting minimum payment amount...');
    try {
      const minAmountResponse = await axios.get(
        `${API_BASE_URL}/min-amount?currency_from=USDTTRC20&currency_to=usd`, 
        {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
      
      console.log('✓ Minimum payment amount:', minAmountResponse.data);
    } catch (minAmountError) {
      console.log('❌ Error fetching minimum payment amount');
      console.error('Error details:', minAmountError.message);
      
      if (minAmountError.response) {
        console.error('Response data:', minAmountError.response.data);
      }
    }
    
    console.log('\nAPI connection test completed successfully! ✅');
    return true;
    
  } catch (error) {
    console.error('❌ API Connection Test Failed');
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
testApiConnection().catch(console.error);