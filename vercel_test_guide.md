# ChickFarms Vercel Testing Guide

This guide explains how to use the testing and verification tools for deploying ChickFarms to Vercel.

## Testing Tools

We've created several tools to streamline the testing and verification process for Vercel deployments:

### 1. Deployment Verification Script

This script performs a comprehensive check of your project configuration:

```bash
node verify-deployment-config.js
```

It verifies:
- Required files exist
- vercel.json configuration is valid
- Build scripts are present
- test-deployment.js contains all required tests
- Environment variables are defined
- API testing works correctly

**When to use**: Before deploying to Vercel to ensure your configuration is correct.

### 2. API Deployment Test Script

This script runs the test-deployment.js API endpoint directly to verify API functionality:

```bash
node test-api-deployment.js
```

It tests:
- Database connectivity
- API functionality
- Environment variables
- Database schema
- NOWPayments configuration

**When to use**: To quickly test API functionality without setting up a server.

### 3. Interactive Web Test Page

We've created two HTML files to help test the deployment:

```
/public/health.html       # Simple health check page
/public/vercel-test.html  # Comprehensive test dashboard
```

After deployment, visit `https://your-app.vercel.app/vercel-test.html` to run interactive tests.

**When to use**: After deployment to verify all functionality is working in the production environment.

## Deployment Process

1. **Pre-Deployment Checks**:
   ```bash
   # Verify configuration
   node verify-deployment-config.js
   
   # Fix any issues
   
   # Run build scripts
   node build-vercel.js && node vercel-api-build.js
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```
   
   Or deploy via the Vercel dashboard.

3. **Post-Deployment Verification**:
   - Visit `https://your-app.vercel.app/vercel-test.html`
   - Run the comprehensive test
   - Check all API endpoints

## Troubleshooting Common Issues

### Database Connection Failures

If you encounter database connection issues:

1. Ensure your DATABASE_URL is correctly formatted
2. Add `?sslmode=require` to your connection string if needed
3. Verify your database allows connections from Vercel's IP ranges:
   - 76.76.21.0/24
   - 76.76.22.0/24
   - 76.76.23.0/24

### Missing or Mismatched Schema

If schema validation fails:

1. Check that all required tables exist (`users`, `chickens`, `transactions`, `referral_earnings`)
2. Run database migrations if needed using Drizzle: `npm run db:push`
3. Verify table names match what the API expects

### API Routes Not Working

If API routes fail to respond:

1. Check `/api/minimal` endpoint first (no database required)
2. Verify API routes configuration in vercel.json
3. Ensure all imports use `.js` extensions

## Commands Reference

| Command | Description |
|---------|-------------|
| `node verify-deployment-config.js` | Verify deployment configuration |
| `node test-api-deployment.js` | Test API functionality directly |
| `node build-vercel.js` | Prepare code for Vercel deployment |
| `node vercel-api-build.js` | Prepare API for Vercel deployment |
| `npm run db:push` | Push database schema changes |
| `vercel --prod` | Deploy to Vercel production |

## Environment Variables

Ensure these environment variables are set in your Vercel deployment:

```
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your_session_secret
NOWPAYMENTS_API_KEY=your_api_key
NOWPAYMENTS_IPN_SECRET_KEY=your_ipn_secret_key
```