# Vercel Function Limit Fix Guide

## Overview

Vercel's Hobby plan has a limit of 12 serverless functions per deployment. This can be an issue for larger applications with many API routes. This guide documents the solution implemented to work around this limitation for the ChickFarms application.

## Solution: Consolidated API Approach

We implemented a solution that consolidates all API endpoints into a single serverless function. This approach has several benefits:

1. Stays within the 12-function limit of the Vercel Hobby plan
2. Maintains all API functionality without compromising features
3. Simplifies deployment and maintenance

## Implementation Details

### 1. Consolidated API Handler

We created a single API handler at `/api/consolidated.js` that handles all API requests. This handler:

- Examines the request URL path to determine which endpoint is being requested
- Routes the request to the appropriate handler function
- Returns the response directly to the client

### 2. Manual Vercel Output Configuration

To ensure Vercel only creates one serverless function instead of automatically detecting multiple routes, we created a manual output configuration:

```
.vercel/
│
├── output/
│   ├── config.json            # Main Vercel config with routes
│   │
│   ├── functions/
│   │   └── api.func/          # Single API function
│   │       ├── .vc-config.json # Function config
│   │       └── index.js        # Consolidated API handler
│   │
│   └── static/                # Static assets
```

### 3. Route Configuration

All routes are configured in `config.json` to point to the single API function:

```json
{
  "version": 3,
  "routes": [
    { "src": "/api/(.*)", "dest": "/api" },
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

This configuration ensures:
- All `/api/*` requests are handled by our single serverless function
- Static files are served directly from the filesystem
- Any other routes are handled by the frontend SPA

## How to Update the API

When making changes to the API:

1. Update the main API code in your Express application as normal
2. Before deployment to Vercel, run the `build-vercel.js` script which will:
   - Generate the consolidated API file
   - Create the Vercel output structure with a single API function
   - Configure all routes properly

## Testing Locally

You can test the consolidated API locally by:

1. Running `node test-api-deployment.js` which simulates the Vercel environment
2. Using the `/api/pooled-test` endpoint to verify all aspects of the API are working correctly

## Deployment Instructions

1. Make sure your API changes are working in the Express application
2. Run the build script: `node build-vercel.js`
3. Deploy to Vercel using the Vercel dashboard or CLI
4. Verify the deployment with the `/api/test-deployment` endpoint

## Limitations

- Debugging can be more complex as all endpoints are in a single file
- Performance isolation between routes is reduced (one slow endpoint could affect others)
- Error handling needs to be robust to prevent crashes of the entire API

## Conclusion

This solution successfully addresses the Vercel function limit while maintaining all the functionality of the ChickFarms API. It allows us to deploy a full-featured application on the Vercel Hobby plan without upgrading to a paid plan or compromising on features.