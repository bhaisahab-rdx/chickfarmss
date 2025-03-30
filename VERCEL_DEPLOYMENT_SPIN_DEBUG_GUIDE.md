# ChickFarms Vercel Deployment - Spin Functionality Debugging Guide

## Introduction

This guide provides detailed steps to diagnose and fix issues with the spin functionality when deployed to Vercel. The spin feature uses authenticated API endpoints that require special routing configuration in the Vercel environment.

## Common Issues

1. **404 Not Found Errors**: Vercel cannot locate the spin endpoints (`/api/spin/status`, `/api/spin/spin`, etc.)
2. **401 Unauthorized Errors**: Authentication isn't working correctly in the Vercel environment
3. **500 Internal Server Errors**: Server-side errors in the spin functionality

## Diagnostic Tools

We've created several tools to help diagnose issues:

1. **Debug Endpoint**: `/api/debug-spin` provides detailed environment information
2. **Test Script**: `test-spin-endpoints.js` compares local and production behavior
3. **Preparation Script**: `prepare-for-vercel.js` ensures correct configuration

## Debugging Steps

### Step 1: Verify Configuration

Check that your Vercel configuration files (`vercel.json` and `.vercel/output/config.json`) have the spin routes in the correct order:

```json
[
  { "src": "/api/debug-spin", "dest": "/api" },
  { "src": "/api/spin/status", "dest": "/api" },
  { "src": "/api/spin/spin", "dest": "/api" },
  { "src": "/api/spin/claim-extra", "dest": "/api" },
  { "src": "/api/spin/(.*)", "dest": "/api" },
  { "src": "/api/(.*)", "dest": "/api" }
]
```

Run the preparation script to fix any issues:

```
node prepare-for-vercel.js
```

### Step 2: Check API Access

Use the debug endpoint to verify API routes are accessible:

1. Visit `/api/debug-spin` in your browser on the Vercel deployment
2. Check the response for:
   - Environment settings
   - Authentication state
   - Route configurations

### Step 3: Authentication Troubleshooting

If you're getting 401 errors, check:

1. **Cookie Settings**: The `secure` and `sameSite` settings in `server/auth.ts` should be compatible with your Vercel deployment
2. **Session Secret**: Ensure `SESSION_SECRET` environment variable is set in Vercel
3. **HTTPS Requirements**: Cookies may require HTTPS in production

Example cookie configuration for production:

```javascript
// In server/auth.ts
app.use(session({
  // ... other settings
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production', // Only use secure in production
    sameSite: 'lax' // Consider 'none' for cross-site requests with secure:true
  }
}));
```

### Step 4: Specific Endpoint Tests

#### Testing `/api/spin/status`

1. Login to your application
2. Open browser developer tools (F12)
3. Navigate to the Network tab
4. Visit the page with spin functionality
5. Look for `/api/spin/status` request
6. Check:
   - Status code (should be 200)
   - Response content (should include canSpinDaily, timeUntilNextSpin, and extraSpinsAvailable)

If you see a 404 error, routes are misconfigured.
If you see a 401 error, authentication is not working.

#### Manual API Testing

Use curl from your terminal to test the API (replace with your Vercel URL):

```bash
# Get the debug information
curl https://your-app.vercel.app/api/debug-spin

# Test spin status (will show 401 without auth)
curl https://your-app.vercel.app/api/spin/status
```

### Step 5: Vercel Logs

Check Vercel function logs for detailed error information:

1. Go to your Vercel dashboard
2. Select your ChickFarms project
3. Navigate to Functions tab
4. Find the `/api` function
5. Check for any errors in the logs, particularly 500 status codes

### Step 6: Compare Local vs Production

Run the test script to compare local and production:

```bash
# Set your Vercel URL
export PRODUCTION_URL=https://your-app.vercel.app

# Run the test
node test-spin-endpoints.js
```

This will show differences in behavior between environments.

## Advanced Fixes

### Authentication Issues

If cookies aren't being set correctly:

1. Edit `server/auth.ts` to adjust cookie settings
2. Consider using `secure: process.env.NODE_ENV === 'production'` to enable HTTPS-only cookies in production
3. Update same-site settings if needed: `sameSite: 'none'` (requires secure:true)
4. Regenerate a new session secret in Vercel environment variables

### Route Ordering Fix

If Vercel is still returning 404 for spin routes despite configuration:

1. Run this command to re-order .vercel/output/config.json routes:
   ```bash
   node update-spin-routes.js
   ```

2. Add more explicit route patterns for each specific spin endpoint

## Testing After Fixes

After making changes, redeploy and:

1. Login to the application
2. Visit the `/api/debug-spin` endpoint to verify configuration
3. Navigate to the spin feature in the app
4. Check browser console for any API errors
5. Run the test script again to compare with local development

## Last Resort Options

If nothing else works:

1. **Move Spin API to Different Path**: Change the API routes to avoid path issues
2. **Custom Server Handling**: Modify the consolidated API handler to special-case spin routes
3. **Client-Side Workaround**: Update the frontend to use different API paths in production

## Conclusion

The most common issue is route ordering in Vercel configuration. Running the `prepare-for-vercel.js` script should fix most problems. If issues persist, the debug endpoint provides valuable information to diagnose specific problems.