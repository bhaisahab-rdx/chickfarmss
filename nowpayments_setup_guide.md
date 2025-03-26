# NOWPayments Setup Guide for ChickFarms

## Introduction

This guide will help you set up and configure NOWPayments for accepting cryptocurrency payments in the ChickFarms application. NOWPayments is a cryptocurrency payment gateway that supports various cryptocurrencies, including USDT (TRC20), which is the primary currency used in ChickFarms.

## Step 1: Create a NOWPayments Account

1. Visit [NOWPayments](https://nowpayments.io/) and sign up for an account
2. Complete the verification process
3. Set up your cryptocurrency wallet addresses for receiving payments

## Step 2: Obtain API Keys

1. Log in to your NOWPayments dashboard
2. Navigate to the "API" section
3. Generate a new API key with the following permissions:
   - Create payments
   - Create invoices
   - Check payment status
   - Check currency rates
4. Copy and securely store your API key

## Step 3: Configure IPN (Instant Payment Notifications)

1. Navigate to the "IPN" section in your NOWPayments dashboard
2. Generate a new IPN secret key
3. Set your IPN callback URL to `https://your-app-domain.com/api/payments/callback`
4. Copy and securely store your IPN secret key

## Step 4: Configure Environment Variables

Add the following environment variables to your application:

```
NOWPAYMENTS_API_KEY=your_api_key
IPN_SECRET_KEY=your_ipn_secret
APP_DOMAIN=https://your-app-domain.com
```

## Step 5: Test the Integration

Run the provided test scripts to verify your integration:

```bash
# Basic API connectivity test
node test-nowpayments-status.js

# Direct invoice creation test
node test-nowpayments-direct.js

# Complete end-to-end payment test
node test-payment-e2e.js
```

## Step 6: Implement Payment Flow in Your Application

1. Update the payment creation code to use the direct invoice approach
2. Implement IPN callback handler to process incoming payments
3. Update transaction status tracking

## Step 7: Configure Production Settings

Before going to production:

1. Update all URLs to use your production domain
2. Generate new API and IPN keys for production use
3. Test the complete payment flow in a staging environment

## Supported Currencies

The primary currency for ChickFarms is USDT (TRC20), but NOWPayments supports many other cryptocurrencies. To accept additional currencies:

1. Enable them in your NOWPayments dashboard
2. Update the payment creation code to support multiple currencies
3. Test each currency to ensure proper conversion rates

## Security Best Practices

1. Never expose your API key or IPN secret in client-side code
2. Always validate IPN callbacks using HMAC signatures
3. Implement proper error handling and logging
4. Keep your NOWPayments integration code updated
5. Monitor transactions for suspicious activity

## Troubleshooting

### Common Issues

1. **Payments not showing up**: Check IPN callback URL and logs
2. **API errors**: Verify API key permissions and IP restrictions
3. **Invoice creation failures**: Ensure amount is above minimum threshold
4. **IPN verification failures**: Check IPN secret key

### Support Channels

- [NOWPayments Support](https://nowpayments.io/help/contact)
- [API Documentation](https://documenter.getpostman.com/view/7907941/S1a32n38?version=latest)

## Fees and Limits

- NOWPayments charges a small fee per transaction (check their latest pricing)
- Each cryptocurrency has minimum and maximum payment amounts
- Transaction processing times vary by cryptocurrency
- Some features may have usage limits based on your account tier

## Next Steps

- Consider implementing multi-currency support
- Set up automated notifications for payment events
- Implement advanced fraud detection measures
- Create a reconciliation process for tracking payments