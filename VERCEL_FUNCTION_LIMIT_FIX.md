# Vercel Function Limit Fix

Vercel's Hobby plan has a limit of 12 serverless functions per deployment. This document outlines how to consolidate your API endpoints to stay within this limit.

## Problem Identified

When deploying to Vercel, you received the following error:

```
Error: No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan. Create a team (Pro plan) to deploy more. Learn More: https://vercel.link/function-count-limit
```

## Solution

We need to consolidate more API routes into fewer serverless functions. We've already combined several auth routes into `consolidated.js`, but we need to further reduce the number of functions.

### Step 1: Update vercel.json

You need to modify your `vercel.json` file to route more API endpoints to fewer functions:

```json
{
  "version": 2,
  "buildCommand": "node build-vercel.js && npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "src": "/api/auth/(.*)", "dest": "/api/consolidated.js" },
    { "src": "/api/user", "dest": "/api/consolidated.js" },
    { "src": "/api/login", "dest": "/api/consolidated.js" },
    { "src": "/api/register", "dest": "/api/consolidated.js" },
    { "src": "/api/logout", "dest": "/api/consolidated.js" },
    { "src": "/api/spin/(.*)", "dest": "/api/game-features.js" },
    { "src": "/api/chicken/(.*)", "dest": "/api/game-features.js" },
    { "src": "/api/farm/(.*)", "dest": "/api/game-features.js" },
    { "src": "/api/market/(.*)", "dest": "/api/game-features.js" },
    { "src": "/api/wallet/(.*)", "dest": "/api/game-features.js" },
    { "src": "/api/admin/(.*)", "dest": "/api/admin-functions.js" },
    { "src": "/api/(.*)", "dest": "/api/consolidated.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://postgres.zgsyciaoixairqqfwvyt:thekinghu8751@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    "SESSION_SECRET": "w8smRGPCRnWFtBSPf9cD",
    "NOWPAYMENTS_API_KEY": "JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3",
    "NOWPAYMENTS_IPN_SECRET_KEY": "A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um"
  }
}
```

### Step 2: Create Additional Consolidated API Files

Create two new consolidated API files:

1. `api/game-features.js` - To handle all game-related API endpoints (spin, chickens, farm, etc.)
2. `api/admin-functions.js` - To handle all admin-related functions

These files should be structured similar to `consolidated.js` but handle different routes.

### Alternative: Use Vercel Pro Plan

If consolidating functions is too complex, consider upgrading to Vercel's Pro plan which allows more functions per deployment.

### Immediate Solution for Testing

The simplest immediate solution is to use the "One Function" approach, where all API routes are handled by a single function:

```json
{
  "version": 2,
  "buildCommand": "node build-vercel.js && npm run build",
  "outputDirectory": "dist",
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/consolidated.js" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://postgres.zgsyciaoixairqqfwvyt:thekinghu8751@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    "SESSION_SECRET": "w8smRGPCRnWFtBSPf9cD",
    "NOWPAYMENTS_API_KEY": "JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3",
    "NOWPAYMENTS_IPN_SECRET_KEY": "A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um"
  }
}
```

Then update `consolidated.js` to handle ALL API routes.

## Performance Considerations

Consolidating all routes into a single function may affect cold start times, as each function will be larger. However, this approach works well for testing and can be optimized later if needed.