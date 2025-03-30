# Vercel Consolidated API Deployment Guide

This guide explains how to deploy the ChickFarms application to Vercel using the consolidated API approach, which solves Vercel's 12 serverless function limit for hobby plans.

## Overview

The consolidated API approach works by:

1. Creating a single serverless function that handles all API routes
2. Using a manual Vercel output configuration to ensure proper routing
3. Testing the consolidated API functionality before deployment

## Deployment Steps

> **Important Note**: The deployment uses Node.js 20.x runtime. Make sure your code is compatible with this version.

### 1. Prepare Your Application

Ensure your application is ready for deployment:

- All required environment variables are set
- All dependencies are installed
- All code changes are committed

### 2. Run the Build Script

Run the build-vercel.js script to prepare your application for deployment:

```bash
node build-vercel.js
```

This script will:
- Update imports for ESM compatibility
- Set up the consolidated API endpoint
- Create the Vercel output structure with a single API function
- Validate the vercel.json configuration

### 3. Test the Consolidated API

Run the test-consolidated-api.js script to verify the consolidated API is working correctly:

```bash
node test-consolidated-api.js
```

This will test the essential API endpoints to ensure they are working properly.

### 4. Deploy to Vercel

Once the tests pass, deploy your application to Vercel using one of these methods:

#### Option A: Using Vercel CLI

```bash
vercel --prod
```

#### Option B: Using GitHub Integration

1. Push your changes to GitHub
2. Connect your repository to Vercel
3. Configure the build settings
4. Deploy

### 5. Vercel-Specific Configuration

Ensure these settings are correct in your Vercel project:

1. **Build Command**: `node build-vercel.js`
2. **Output Directory**: `.vercel/output`
3. **Environment Variables**: Copy all required environment variables to Vercel

### 6. Environment Variables

The following environment variables must be set in Vercel:

- `DATABASE_URL` - The PostgreSQL database connection string
- `NODE_ENV` - Set to "production" for production deployments
- `SESSION_SECRET` - Secret for session encryption
- `NOWPAYMENTS_API_KEY` - API key for NOWPayments integration
- `NOWPAYMENTS_IPN_SECRET_KEY` - IPN secret key for NOWPayments

### 7. Post-Deployment Verification

After deployment, verify these endpoints are working:

- `/api/health` - Should return status "ok" with timestamp
- `/api/minimal` - Should return simple status "ok"
- `/api/diagnostics` - Should show environment and database status
- `/api` - Should show the API index page

### 8. Troubleshooting

If you encounter issues:

1. Check the Vercel deployment logs for errors
2. Verify that all environment variables are set correctly
3. Make sure the database is accessible from Vercel
4. Test specific API endpoints to narrow down the issue

### 9. Notes About the Consolidated API Approach

- All API routes are handled by a single function in `api/consolidated.cjs`
- This function parses the URL path and routes requests to the appropriate handler
- This method stays within Vercel's limit of 12 serverless functions
- Enabling Edge Functions in future could be an alternative to this approach

## Conclusion

With this approach, you can deploy complex applications to Vercel Hobby plans while staying within the 12 function limit. The consolidated API pattern efficiently handles all API requests through a single serverless function.