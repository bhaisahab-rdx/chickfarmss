require('dotenv').config();
const axios = require('axios');

// Function to create an invoice directly using the NOWPayments API
async function testCreateInvoice() {
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  
  if (!apiKey) {
    console.error('ERROR: NOWPAYMENTS_API_KEY environment variable is not set');
    console.log('Please set this variable with your NOWPayments API key to proceed.');
    return;
  }
  
  const requestData = {
    price_amount: 10,
    price_currency: "USD",
    pay_currency: "USDT",
    order_id: "TEST-" + Date.now(),
    order_description: "ChickFarms test deposit",
    ipn_callback_url: "https://workspace.hirosenaka.repl.co/api/payments/callback",
    success_url: "https://workspace.hirosenaka.repl.co/wallet?payment=success",
    cancel_url: "https://workspace.hirosenaka.repl.co/wallet?payment=cancelled"
  };
  
  console.log('Sending request to NOWPayments API with the following data:');
  console.log(JSON.stringify(requestData, null, 2));
  
  try {
    const response = await axios.post(
      "https://api.nowpayments.io/v1/invoice", 
      requestData,
      {
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log('SUCCESS! Invoice created:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\nCURL command for manual testing:');
    console.log(`curl -X POST \\
      https://api.nowpayments.io/v1/invoice \\
      -H "x-api-key: YOUR_API_KEY_HERE" \\
      -H "Content-Type: application/json" \\
      -d '${JSON.stringify(requestData)}'`);
      
    return response.data;
  } catch (error) {
    console.error('ERROR creating invoice:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      
      // Provide specific guidance based on error codes
      if (error.response.status === 400) {
        console.log('\n--- DEBUGGING HELP ---');
        console.log('Bad Request (400) indicates invalid parameters. Check:');
        console.log('1. Currency codes - should be uppercase (USDT not usdt)');
        console.log('2. Price amount - must be above minimum threshold');
        console.log('3. Callback URLs - must be publicly accessible');
      } else if (error.response.status === 401) {
        console.log('\n--- DEBUGGING HELP ---');
        console.log('Unauthorized (401) indicates API key issues:');
        console.log('1. Verify your API key is correct and active');
        console.log('2. Check if the key has proper permissions');
      }
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testCreateInvoice();