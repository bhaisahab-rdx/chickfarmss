# NOWPayments Integration Guide for ChickFarms

## Overview

This guide documents the implementation of NOWPayments cryptocurrency payment gateway in the ChickFarms application. The integration allows users to deposit USDT (TRC20) and other cryptocurrencies into their in-game wallet.

## Prerequisites

- NOWPayments API Key
- IPN Secret Key (for secure callback verification)
- Application domain for callback URLs

## Environment Variables

The following environment variables must be configured:

```
NOWPAYMENTS_API_KEY=your_api_key
IPN_SECRET_KEY=your_ipn_secret
APP_DOMAIN=https://your-app-domain.com
```

## Integration Points

### 1. Invoice Creation

NOWPayments invoices are created via their Invoice API. The implementation avoids the JWT authentication process and directly uses the API key for authentication.

```typescript
// Sample code to create an invoice
const requestData = {
  price_amount: amount,
  price_currency: 'USD',
  pay_currency: 'USDTTRC20',
  order_id: orderId,
  order_description: description,
  ipn_callback_url: `${domain}/api/payments/callback`,
  success_url: successUrl || `${domain}/wallet?payment=success`,
  cancel_url: cancelUrl || `${domain}/wallet?payment=cancelled`
};

const response = await axios.post(
  'https://api.nowpayments.io/v1/invoice',
  requestData,
  { 
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    }
  }
);
```

### 2. Minimum Payment Amount

To ensure valid payment amounts, the integration checks the minimum payment amount for the chosen cryptocurrency:

```typescript
const minAmountResponse = await axios.get(
  `https://api.nowpayments.io/v1/min-amount?currency_from=USDTTRC20&currency_to=USDTTRC20`,
  { headers: { 'x-api-key': apiKey } }
);

const minAmount = minAmountResponse.data.min_amount;
```

### 3. IPN Callback Processing

When a payment is received, NOWPayments sends a callback to the specified IPN URL. This callback must be verified using the IPN secret:

```typescript
app.post('/api/payments/callback', async (req, res) => {
  // Verify IPN signature
  const ipnSecret = process.env.IPN_SECRET_KEY;
  const signature = req.headers['x-nowpayments-sig'];
  
  if (!signature) {
    return res.status(400).send('Missing signature header');
  }
  
  // Create HMAC signature from request body
  const hmac = crypto.createHmac('sha512', ipnSecret);
  hmac.update(JSON.stringify(req.body));
  const calculatedSignature = hmac.digest('hex');
  
  // Compare signatures
  if (calculatedSignature !== signature) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process the payment
  const { payment_status, order_id, price_amount } = req.body;
  
  if (payment_status === 'confirmed' || payment_status === 'finished') {
    // Credit the user's account
    // Update transaction status
  }
  
  res.status(200).send('IPN received');
});
```

## Testing

A comprehensive test suite is provided to validate the integration:

- `test-nowpayments-status.js` - Tests basic API connectivity
- `test-nowpayments-direct.js` - Tests direct invoice creation
- `test-payment-e2e.js` - End-to-end payment process test

To run tests:

```bash
node test-payment-e2e.js
```

## Payment Flow

1. User initiates a deposit from the wallet page
2. Application creates an invoice via the NOWPayments API
3. User is redirected to the NOWPayments checkout page
4. User completes payment using their cryptocurrency wallet
5. NOWPayments sends an IPN callback to confirm the payment
6. Application credits the user's account
7. User is redirected back to the application

## Troubleshooting

### Common Issues

1. **403 Forbidden errors** - The API key may not have the required permissions. Contact NOWPayments support.
2. **IPN callbacks not received** - Ensure your callback URL is publicly accessible and correctly configured.
3. **Minimum amount errors** - Payment amounts must be above the minimum threshold (approximately 8 USD for USDTTRC20).

### Logs

Review logs with the `[NOWPayments]` prefix for detailed diagnostics information:

```
[NOWPayments] Creating invoice with data: {...}
[NOWPayments] Invoice created successfully: 1234567890
```

## Security Considerations

1. Always validate IPN callbacks using the HMAC signature
2. Store API keys and secrets securely as environment variables
3. Handle failed payments gracefully
4. Implement proper error handling for all API calls

## Resources

- [NOWPayments API Documentation](https://documenter.getpostman.com/view/7907941/S1a32n38?version=latest)
- [IPN Implementation Guide](https://nowpayments.io/help/ipn)
- [Supported Cryptocurrencies](https://nowpayments.io/supported-coins)