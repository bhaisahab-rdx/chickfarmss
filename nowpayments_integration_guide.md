# NOWPayments Integration Guide for ChickFarms (March 2025)

This guide explains how to integrate and configure NOWPayments cryptocurrency payment processing for your ChickFarms application.

> **IMPORTANT UPDATE (March 30, 2025)**: The ChickFarms payment system now features fully automated transaction processing through NOWPayments IPN webhooks. Manual approval of recharge transactions is no longer required as the system automatically credits user accounts upon confirmed payments. This streamlines the payment process and improves user experience.

## Overview

NOWPayments allows ChickFarms to accept cryptocurrency payments (USDT TRC20) for in-game purchases and deposits. This integration enables:

- Generation of payment invoices
- Real-time payment notifications via webhooks (IPN)
- Automatic crediting of user accounts upon payment completion (no admin intervention required)

## Setup Requirements

1. NOWPayments business account (sign up at [NOWPayments](https://nowpayments.io/))
2. API key for making requests to NOWPayments API
3. IPN Secret key for validating webhook notifications
4. Server with webhook endpoint accessible from the internet

## Integration Steps

### Step 1: Create a NOWPayments Account

1. Sign up at [NOWPayments](https://nowpayments.io/)
2. Complete the business verification process
3. Add a Tron (TRC20) wallet address to receive payments

### Step 2: Obtain API Credentials

1. Go to Store Settings → API Keys
2. Generate a new API key
3. Generate an IPN Secret key
4. Save both keys in a secure location

### Step 3: Configure Environment Variables

Add the following to your `.env` file or deployment environment variables:

```
NOWPAYMENTS_API_KEY=your_api_key_here
NOWPAYMENTS_IPN_SECRET_KEY=your_ipn_secret_key_here
```

### Step 4: Add API Integration Code

The integration is already implemented in the ChickFarms codebase:

- Payment invoice creation: `server/services/nowpayments.ts`
- IPN (webhook) handling: `server/routes-nowpayments.ts`

### Step 5: Configure IPN (Webhook) in NOWPayments Dashboard

1. Go to Store Settings → IPN Callbacks
2. Add your endpoint URL: `https://your-domain.com/api/ipn/nowpayments`
3. Set Status to "Active"
4. Select "All Events" under "Events to Send"

## Testing the Integration

### Test Invoice Creation

Use the wallet deposit interface in ChickFarms to create a payment invoice. Verify:

1. Invoice is created successfully
2. Payment URL is generated
3. Payment status is tracked correctly

### Test IPN (Webhook)

1. Make a test payment using the provided payment URL
2. Monitor server logs for incoming webhook notifications
3. Verify user balance is updated automatically after payment confirmation (no manual approval needed)
4. Check the admin panel to confirm the transaction is marked as "completed" automatically

## Troubleshooting Guide

### Common Issues:

1. **Invoice Creation Fails**
   - Verify API key is correct
   - Check server logs for detailed error messages
   - Ensure the NOWPayments API is operational

2. **IPN Webhook Not Received**
   - Verify your server is accessible from the internet
   - Check IPN URL configuration in NOWPayments dashboard
   - Verify IPN Secret key is correctly configured

3. **Payment Received But User Balance Not Updated**
   - Check IPN signature validation in `server/routes-nowpayments.ts`
   - Verify transaction processing logic in payment handler
   - Check database connection and transaction records
   - Ensure NOWPayments webhook endpoints are correctly set up

4. **Automated Payment Processing Not Working**
   - Verify the IPN Secret key is correctly configured in environment variables
   - Check server logs for IPN callback validation errors
   - Ensure the NOWPayments IPN callback status is set to "Active" in the dashboard
   - Verify that the processIPNNotification function in server/services/nowpayments.ts is working properly

## API Reference

### Main API Endpoints Used:

1. `POST /api/invoice` - Creates a payment invoice
   - Parameters: `price_amount`, `price_currency`, `pay_currency`, `order_id`, `order_description`
   - Response: Invoice details including payment URL

2. `GET /api/payment/{payment_id}` - Checks payment status
   - Parameters: `payment_id`
   - Response: Current payment status and details

### IPN Webhook Payload

The IPN webhook sends a JSON payload with payment information:

```json
{
  "payment_id": "5374434",
  "payment_status": "confirmed",
  "pay_address": "TXoSMGpSgN8FH9Y7Gx4PdQmJDv7QkLYGt5",
  "price_amount": 10.0,
  "price_currency": "usd",
  "pay_amount": 10.0,
  "actually_paid": 10.0,
  "pay_currency": "trx",
  "order_id": "USDT_DEPOSIT_123",
  "order_description": "Deposit 10 USDT to user account",
  "ipn_callback_url": "https://your-domain.com/api/ipn/nowpayments",
  "created_at": "2023-03-30T08:13:15.230Z",
  "updated_at": "2023-03-30T08:15:05.342Z"
}
```

## Security Considerations

1. **Always validate IPN signature** - Verify that webhook notifications are actually from NOWPayments
2. **Store API keys securely** - Never expose keys in client-side code
3. **Implement idempotent processing** - Prevent duplicate crediting on repeated webhook calls
4. **Validate payment amounts** - Ensure the paid amount matches the expected amount

## Resources

- [NOWPayments API Documentation](https://documenter.getpostman.com/view/7907941/S1a32n38?version=latest)
- [NOWPayments IPN Documentation](https://nowpayments.io/help/what-is-ipn-callback-and-how-to-set-it-up)
- Test your integration in the ChickFarms admin dashboard