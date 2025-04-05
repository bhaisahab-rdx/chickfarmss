# NOWPayments Integration Guide for ChickFarms

This guide explains how the NOWPayments cryptocurrency payment system is integrated into ChickFarms for accepting USDT (TRC20) payments.

## Configuration Overview

The integration uses both the NOWPayments API and Instant Payment Notification (IPN) system to create a secure payment flow.

### Environment Variables

Required environment variables for NOWPayments integration:

```
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET_KEY=your_ipn_secret_here
```

These must be configured in the Vercel deployment settings and match your NOWPayments account.

## API Integration

ChickFarms uses two main NOWPayments endpoints:

1. **Invoice Creation Endpoint**:
   `https://api.nowpayments.io/v1/invoice`

   Used to generate payment links with specified USDT amount and callback URLs.

2. **IPN Callback Endpoint**:
   `https://chiket.vercel.app/api/payments/nowpayments/ipn`

   Receives payment confirmations from NOWPayments when a transaction is complete.

## Server Implementation

The server-side implementation is in `server/routes-nowpayments.ts` and handles:

1. Creating invoices for in-game purchases
2. Processing IPN callbacks to verify payments
3. Updating user balances and inventory once payment is confirmed

## Payment Flow

1. User requests to purchase an item (chicken, mystery box, etc.)
2. Server creates a NOWPayments invoice with specific amount and callback URL
3. User is redirected to NOWPayments payment page
4. User completes payment using USDT (TRC20)
5. NOWPayments sends IPN notification to our callback URL
6. Server verifies the IPN signature using the IPN secret key
7. If valid, server updates user's account with purchased items

## Vercel Deployment Considerations

For the IPN system to work correctly in Vercel:

1. The callback URL must be publicly accessible
2. The endpoint must be properly configured in `vercel.json`
3. The API route must be properly set up in the Vercel API handlers

## Troubleshooting

Common issues and solutions:

1. **IPN Not Received**:
   - Verify that the callback URL is publicly accessible
   - Check the IPN endpoint is properly configured in NOWPayments dashboard
   - Ensure the Vercel API route is correctly configured

2. **Payment Verification Failures**:
   - Confirm both API_KEY and IPN_SECRET_KEY are correct
   - Verify that the SHA-512 signature validation is working properly
   - Check server logs for detailed error messages

3. **CORS Issues**:
   - Ensure proper CORS headers are set for the IPN endpoint
   - NOWPayments IPN calls don't require CORS but browser-based API calls do

## Testing

For testing NOWPayments integration:

1. Use the test mode in NOWPayments dashboard
2. Create small-value test transactions
3. Monitor the server logs for IPN receipt and processing

## Security Considerations

The integration implements several security measures:

1. SHA-512 signature validation of all IPN callbacks
2. Server-side validation of payment amounts
3. Secure handling of API keys via environment variables
4. Transaction ID tracking to prevent duplicate processing