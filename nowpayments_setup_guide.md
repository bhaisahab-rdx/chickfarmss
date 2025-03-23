# Setting Up NOWPayments API for ChickFarms

## Step 1: Create a NOWPayments Account

1. Go to [NOWPayments.io](https://nowpayments.io/) and sign up for an account
2. Complete the registration process and verify your email

## Step 2: Create an API Key

1. Log in to your NOWPayments dashboard
2. Go to "Store Settings" in the left sidebar
3. Click on the "API" tab
4. Click "Create new API key"
5. Give your API key a name (e.g., "ChickFarms Production")
6. Select the permissions needed:
   - Payment status updates
   - Create/manage payment invoices
   - IPN management
7. Click "Generate API key"
8. Copy the API key - this is your `NOWPAYMENTS_API_KEY` environment variable

## Step 3: Configure IPN (Instant Payment Notification)

After your application is deployed to Vercel:

1. In the NOWPayments dashboard, go to "Store Settings"
2. Click on the "IPN" tab
3. Set your IPN callback URL:
   ```
   https://your-app.vercel.app/api/payments/callback
   ```
   (Replace `your-app.vercel.app` with your actual Vercel domain)
4. Save the settings

## Step 4: Set Up Payment Currencies

1. In the NOWPayments dashboard, go to "Settings"
2. Click on the "Currencies" tab
3. Enable the cryptocurrencies you want to accept (at minimum, enable USDT)
4. Set your payout currency (the currency you want to receive)

## Step 5: Add NOWPayments API Key to Vercel

1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add a new environment variable:
   ```
   Name: NOWPAYMENTS_API_KEY
   Value: your-nowpayments-api-key
   ```
4. Save changes and redeploy your application

## Step 6: Test Payment Flow

After deployment is complete:

1. Log in to your ChickFarms application
2. Navigate to the Wallet page
3. Attempt to make a small deposit
4. Verify that the NOWPayments payment form or QR code appears
5. Check your NOWPayments dashboard to see if the payment request was created
6. (Optional) Complete a test transaction with a small amount (0.5-1 USDT) to verify the full payment flow

## Troubleshooting NOWPayments Integration

If you encounter issues with the NOWPayments integration:

1. **API Key Issues**:
   - Verify that the API key is correctly added to your Vercel environment variables
   - Ensure the API key has the correct permissions

2. **IPN Callback Issues**:
   - Make sure your callback URL is correctly formatted and accessible
   - Check that your Vercel function is properly handling the callback

3. **Payment Processing Issues**:
   - Verify the payment creation response in your application logs
   - Check the NOWPayments dashboard for the status of the payment
   - Ensure your application correctly updates transaction status

## Important Notes

1. **Sandbox Mode**: NOWPayments offers a sandbox mode for testing. Use this before going live.

2. **Transaction Fees**: Be aware of NOWPayments transaction fees when setting up your pricing.

3. **KYC Requirements**: Depending on your volume, you might need to complete KYC verification with NOWPayments.

4. **API Rate Limits**: NOWPayments has API rate limits. Ensure your application respects these limits.