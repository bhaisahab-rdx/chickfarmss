import * as dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';

dotenv.config();

// Configuration
const API_KEY = process.env.NOWPAYMENTS_API_KEY;
const BASE_URL = 'https://api.nowpayments.io/v1';
const APP_DOMAIN = 'https://workspace.sunabucha.repl.co';

/**
 * Comprehensive test for the entire NOWPayments integration flow
 * Tests direct invoice creation without JWT authentication
 */
async function testCompletePaymentFlow() {
  console.log('========================================');
  console.log('NOWPayments Complete Integration Test');
  console.log('========================================');
  
  // Step 1: Check API key and configuration
  if (!API_KEY) {
    console.error('❌ NOWPAYMENTS_API_KEY is not set');
    process.exit(1);
  }
  
  console.log('✓ API Key is configured');
  console.log(`API Key starts with: ${API_KEY.substring(0, 4)}...`);
  
  // Step 2: Get minimum payment amount for USDTTRC20
  console.log('\n[Step 1] Checking minimum payment amount for USDTTRC20...');
  
  try {
    const minAmountResponse = await axios.get(
      `${BASE_URL}/min-amount?currency_from=USDTTRC20&currency_to=USDTTRC20`,
      { headers: { 'x-api-key': API_KEY } }
    );
    
    const minAmount = minAmountResponse.data.min_amount;
    console.log(`✓ Minimum payment amount for USDTTRC20: ${minAmount}`);
    
    // Use a slightly higher amount than minimum to ensure it works
    const testAmount = Math.max(minAmount * 1.1, 10);
    console.log(`Using test amount: ${testAmount} USD`);
    
    // Step 3: Create invoice
    console.log('\n[Step 2] Creating payment invoice...');
    
    const orderId = 'TEST-' + Date.now();
    const invoiceData = {
      price_amount: testAmount,
      price_currency: 'USD',
      pay_currency: 'USDTTRC20',
      order_id: orderId,
      order_description: 'ChickFarms test deposit',
      ipn_callback_url: `${APP_DOMAIN}/api/payments/callback`,
      success_url: `${APP_DOMAIN}/wallet?payment=success`,
      cancel_url: `${APP_DOMAIN}/wallet?payment=cancelled`
    };
    
    const invoiceResponse = await axios.post(
      `${BASE_URL}/invoice`,
      invoiceData,
      { headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' } }
    );
    
    if (!invoiceResponse.data.id) {
      throw new Error('No invoice ID returned');
    }
    
    console.log('✓ Invoice created successfully!');
    console.log(`Invoice ID: ${invoiceResponse.data.id}`);
    console.log(`Payment URL: ${invoiceResponse.data.invoice_url}`);
    
    // Save the invoice details to a file for reference
    const invoiceDetails = {
      id: invoiceResponse.data.id,
      invoice_url: invoiceResponse.data.invoice_url,
      order_id: orderId,
      amount: testAmount,
      created_at: new Date().toISOString()
    };
    
    fs.writeFileSync('last-test-invoice.json', JSON.stringify(invoiceDetails, null, 2));
    console.log('\nInvoice details saved to last-test-invoice.json');
    
    // Print a checkout link that can be used to test the payment
    console.log('\n---------------------------------------------------');
    console.log('TEST CHECKOUT URL:');
    console.log(invoiceResponse.data.invoice_url);
    console.log('---------------------------------------------------');
    console.log('\nOpen the above URL in your browser to test the payment process');
    console.log('After payment, you should be redirected to the success URL');
    
    // Step 4: Check status endpoint (optional, just to verify connectivity)
    console.log('\n[Step 3] Checking NOWPayments API status...');
    const statusResponse = await axios.get(
      `${BASE_URL}/status`,
      { headers: { 'x-api-key': API_KEY } }
    );
    
    console.log(`✓ API Status: ${statusResponse.data.message}`);
    
    console.log('\n✅ Test completed successfully! The payment integration is working properly.');
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    
    if (error.response) {
      console.error(`Error status: ${error.response.status}`);
      console.error('Error data:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\nThe API key might be invalid or missing proper permissions.');
      } else if (error.response.status === 400) {
        console.error('\nBad request - check the parameters being sent.');
      } else if (error.response.status === 403) {
        console.error('\nAccess forbidden - your API key might not have permission for this operation.');
      }
    } else if (error.request) {
      console.error('No response received from the server. Network issue?');
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}

// Run the test
testCompletePaymentFlow();