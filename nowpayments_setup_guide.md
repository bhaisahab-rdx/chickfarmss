# NOWPayments Integration Guide for ChickFarms

This guide explains how to set up NOWPayments cryptocurrency payment processing for ChickFarms. Our integration uses the official NOWPayments checkout page to provide a secure, reliable payment experience.

## Integration Overview

ChickFarms integrates with NOWPayments to allow users to:
1. Deposit funds into their game wallet using cryptocurrencies
2. Process payments securely through the official NOWPayments platform
3. Automatically update wallet balances when payments are verified

## Development vs Production

The application can work in two modes:

1. **Development Mode**: Works without API keys for testing purposes, simulating payment flows
2. **Production Mode**: Connects to NOWPayments' official system for real cryptocurrency transactions

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

- USDTTRC20 (USDT on Tron Network) - **Primary payment option**
- BTC (Bitcoin)
- ETH (Ethereum)
- DOGE (Dogecoin)
- LTC (Litecoin)
- BNB (Binance Coin)
- And many more...

**Important**: ChickFarms is configured to primarily use USDT on the Tron network (TRC20) as the default payment method. This provides faster and more cost-effective transactions for users. While other cryptocurrencies are available at checkout, the system will automatically attempt to use USDTTRC20 when available.

### Fallback Mechanism

The payment system includes an intelligent fallback mechanism:

1. First attempts to use USDTTRC20 (USDT on Tron Network) 
2. If USDTTRC20 is unavailable, automatically falls back to other cryptocurrencies
3. Uses the first available cryptocurrency provided by NOWPayments
4. All payment options are displayed on the NOWPayments checkout page

## Technical Implementation Details

Our NOWPayments integration includes the following key components:

### 1. Payment Flow

1. **Deposit Initialization**: When a user clicks "Pay with Any Cryptocurrency" in the wallet section
2. **Invoice Creation**: System creates a NOWPayments invoice using their API
3. **Checkout Redirection**: User is directed to the official NOWPayments checkout page
4. **Payment Processing**: User completes payment using their selected cryptocurrency
5. **IPN Notification**: NOWPayments sends a notification to our server via IPN callback
6. **Balance Update**: System verifies the payment and updates the user's game balance

### 2. Enhanced Error Handling

The integration includes sophisticated error handling:

- **API Connection Issues**: Timeouts are set to prevent hanging on slow connections
- **Detailed Logging**: System logs all payment-related events for troubleshooting
- **User-Friendly Errors**: Clear messages inform users of issues in the payment process
- **Fallback Currency**: If USDTTRC20 is unavailable, other cryptocurrencies are offered

### 3. Security Features

- **IPN Signature Verification**: All callbacks from NOWPayments are cryptographically verified
- **Secure Environment Variables**: API keys and secrets are stored securely
- **Status Monitoring**: System regularly checks the NOWPayments service status
- **Idempotent Processing**: Payments are processed once regardless of multiple callbacks

## Troubleshooting

If you encounter issues with the payment process:

1. **Check API Key**: Verify your API key is correctly configured
2. **Check IPN Secret**: Make sure your IPN secret is set correctly
3. **Check Logs**: Review the server logs for any error messages - look for `[NOWPayments]` and `[Payment Service Status]` entries
4. **USDT Network Issue**: If you're seeing errors specifically with USDTTRC20, the system will automatically fall back to other available cryptocurrencies. This is normal during maintenance periods.
5. **Verify NOWPayments Status**: Check [NOWPayments Status Page](https://nowpayments.io/status) to verify their service is operational
6. **Callback URL**: Ensure your server can receive callbacks from NOWPayments (check firewall settings)
7. **Test Connection**: Use the status check endpoint to verify API connectivity: `/api/public/payments/service-status`
8. **Timeout Errors**: If seeing timeout errors, NOWPayments API might be experiencing delays - the system will retry automatically

## Support

If you need help with your NOWPayments integration, contact support:

- NOWPayments Support: [https://nowpayments.io/help](https://nowpayments.io/help)
- ChickFarms Support: Contact your administrator