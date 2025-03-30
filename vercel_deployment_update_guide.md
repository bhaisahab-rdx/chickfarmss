# ChickFarms Vercel Deployment Update Guide

This guide addresses recent issues with deploying ChickFarms to Vercel and provides solutions to ensure successful deployment.

## Key Issues Identified

1. **Database Schema Validation**: The `test-deployment.js` API endpoint was looking for a "referrals" table, but our implementation uses "referral_earnings" instead.

2. **Environment Variables**: Missing NODE_ENV setting during deployment testing.

## Solutions Implemented

### 1. Database Schema Validation Fix

We've updated the `test-deployment.js` file to accept alternative table names for the referrals system:

```javascript
// Map required tables to actual table names (in case of naming differences)
const requiredTablesMapping = {
  'users': 'users',
  'chickens': 'chickens',
  'transactions': 'transactions',
  'referrals': ['referrals', 'referral_earnings']  // Accept either referrals or referral_earnings
};

// Check if each required entity exists in the database
const missingTables = [];
for (const [requiredName, actualNames] of Object.entries(requiredTablesMapping)) {
  const actualNamesArray = Array.isArray(actualNames) ? actualNames : [actualNames];
  // If none of the possible table names for this entity exist, mark it as missing
  if (!actualNamesArray.some(name => tables.includes(name))) {
    missingTables.push(requiredName);
  }
}
```

This change makes the schema validation more flexible by recognizing either "referrals" or "referral_earnings" as valid implementations of the referral system.

### 2. Environment Variables

Ensure the following environment variables are set in your Vercel project settings:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `postgresql://[username]:[password]@[host]:[port]/[database]` |
| `SESSION_SECRET` | `[your-session-secret]` |
| `NOWPAYMENTS_API_KEY` | `[your-nowpayments-api-key]` |
| `NOWPAYMENTS_IPN_SECRET_KEY` | `[your-nowpayments-ipn-secret-key]` |

## Deployment Process

Follow these steps to deploy your updated application:

1. **Pre-Deployment**: Run the build scripts locally to prepare your code:
   ```bash
   node build-vercel.js && node vercel-api-build.js
   ```

2. **Deployment**: Use one of the following methods:

   **Option A: Vercel CLI**
   ```bash
   vercel --prod
   ```

   **Option B: GitHub Integration**
   - Push your changes to GitHub
   - Deploy from the Vercel dashboard

3. **Verification**: After deployment, verify your application:
   - Check the application URL
   - Test `/api/health` endpoint
   - Test `/api/test-deployment` endpoint

## Verification Checklist

- [ ] Front-end loads correctly
- [ ] API endpoints respond appropriately
- [ ] `/api/test-deployment` passes all tests
- [ ] Database connections are successful
- [ ] NOWPayments integration works

## Troubleshooting

If you encounter issues:

1. **Database Connection Issues**:
   - Check that your database allows connections from Vercel's IP ranges
   - Verify the DATABASE_URL format
   - Add `?sslmode=require` if using a secure connection

2. **Test-Deployment Issues**:
   - Check the console logs for specific test failures
   - Verify all required tables exist in your database
   - Ensure environment variables are set correctly

3. **Frontend not Loading**:
   - Check that the root redirect is working
   - Verify the static file paths in vercel.json

## Support

If you continue to experience issues, contact support@chickfarms.com with your deployment logs and error messages.