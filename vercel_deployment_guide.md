# ChickFarms Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the ChickFarms application on Vercel.

## Prerequisites

Before deploying to Vercel, make sure you have:

1. A [Vercel account](https://vercel.com/signup)
2. Access to the PostgreSQL database (Supabase or similar)
3. NOWPayments API key and IPN secret key (for payment processing)

## Step 1: Fork or Clone the Repository

First, ensure you have the latest version of the ChickFarms codebase in your own repository.

## Step 2: Set Up Environment Variables

In your Vercel project settings, add the following environment variables:

```
DATABASE_URL=your_postgresql_connection_string
SESSION_SECRET=your_secure_session_secret
NODE_ENV=production
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET_KEY=your_nowpayments_ipn_secret_key
VERCEL_URL=${VERCEL_URL}
```

The `VERCEL_URL` variable is automatically provided by Vercel, so you don't need to set a specific value.

## Step 3: Configure Vercel Build Settings

Ensure your Vercel project is configured with the following settings:

1. **Framework Preset**: Custom (No Framework)
2. **Build Command**: `./vercel-build.sh`
3. **Output Directory**: `dist`

## Step 4: Deploy to Vercel

1. Connect your repository to Vercel
2. Configure your project settings as described above
3. Click "Deploy"

## Verifying Deployment

After deployment, your application should be accessible at your Vercel domain (usually `your-project-name.vercel.app`).

To verify everything is working correctly:

1. Test user registration and login
2. Verify chicken management functionality
3. Check that the NOWPayments integration works by testing a small deposit
4. Verify that the admin panel is accessible for admin users

## Troubleshooting Common Issues

### API Routes Return 404 Errors

If your API routes return 404 errors:

1. Verify that `vercel.json` has the correct route configuration
2. Check that the API serverless function was built correctly
3. Ensure your `buildCommand` is executing `vercel-build.sh` correctly

### Database Connection Issues

If your application can't connect to the database:

1. Double-check your `DATABASE_URL` environment variable
2. Ensure your database allows connections from Vercel's IP ranges
3. Verify that the database schema has been properly migrated

### NOWPayments Integration Issues

If payments don't process correctly:

1. Verify your NOWPayments API keys are correct
2. Check that your IPN callback URL is configured correctly in the NOWPayments dashboard
3. Ensure the environment variables are properly set in Vercel

## Maintaining Your Deployment

For future updates:

1. Make changes to your codebase locally and test thoroughly
2. Push changes to your repository
3. Vercel will automatically rebuild and redeploy your application

## Need Help?

If you encounter any issues during deployment, check the Vercel logs for error messages or contact support for assistance.