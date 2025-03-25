# NOWPayments Integration Guide for ChickFarms

This guide explains how to set up NOWPayments cryptocurrency payment processing for ChickFarms.

## Development vs Production

The application can work in two modes:

1. **Development Mode**: Works without API keys for testing purposes
2. **Production Mode**: Requires proper NOWPayments credentials

## Setting Up NOWPayments (Production)

Follow these steps to enable real cryptocurrency payments:

### Step 1: Create a NOWPayments Account

1. Sign up at [NOWPayments.io](https://nowpayments.io)
2. Verify your account and complete KYC requirements

### Step 2: Create API Keys

1. Log in to your NOWPayments dashboard
2. Navigate to **Store Settings** > **API Keys**
3. Create a new API key
4. Copy your API key for the next step

### Step 3: Configure IPN (Instant Payment Notifications)

1. Go to **Store Settings** > **IPN**
2. Create a new IPN secret
3. Add your callback URL: `https://your-domain.com/api/payments/callback`
4. Save your IPN secret for the next step

### Step 4: Configure Your ChickFarms Application

Add the following environment variables to your application:

```
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET=your_ipn_secret_here
```

You can add these in your hosting provider's environment variables section, or by contacting support.

### Step 5: Test the Integration

1. Log in to your ChickFarms account
2. Navigate to the Wallet section
3. Click "Deposit" and select a cryptocurrency
4. Complete a small test transaction to verify everything works

## Supported Cryptocurrencies

NOWPayments supports a wide range of cryptocurrencies, including:

- USDT (Tether)
- BTC (Bitcoin)
- ETH (Ethereum)
- DOGE (Dogecoin)
- LTC (Litecoin)
- BNB (Binance Coin)
- And many more...

## Troubleshooting

If you encounter issues with the payment process:

1. **Check API Key**: Verify your API key is correctly configured
2. **Check IPN Secret**: Make sure your IPN secret is set correctly
3. **Check Logs**: Review the server logs for any error messages
4. **Test Mode**: You can test without real funds using NOWPayments' test mode

## Support

If you need help with your NOWPayments integration, contact support:

- NOWPayments Support: [https://nowpayments.io/help](https://nowpayments.io/help)
- ChickFarms Support: Contact your administrator