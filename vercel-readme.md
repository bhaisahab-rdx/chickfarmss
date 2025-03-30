# ChickFarms Vercel Deployment Guide

## Deployment Setup

Follow these steps to properly deploy ChickFarms to Vercel:

### 1. Project Settings in Vercel Dashboard

- **Framework Preset**: Select "Custom" (or "Other" if Custom isn't available)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`
- **Development Command**: Leave empty

### 2. Environment Variables

Make sure the following environment variables are set in your Vercel project:

```
DATABASE_URL=postgresql://postgres:thekinghu8751@db.zgsyciaoixairqqfwvyt.supabase.co:5432/postgres
SESSION_SECRET=,Y1#!e&yGr-.%;Zb7X*W](YJ=DyE-F
NODE_ENV=production
NOWPAYMENTS_API_KEY=JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3
NOWPAYMENTS_IPN_SECRET_KEY=A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um
```

### 3. Vercel Configuration Files

Make sure these files are properly set up:

1. **vercel.json**: Contains build settings and routes configuration
   - Configure memory and duration limits for functions
   - Set proper route order with specific routes first
   - Include proper Content-Type headers for HTML routes

2. **.vercelignore**: Prevents unnecessary files from being uploaded
   - Include node_modules, .git, etc.

3. **API Handlers**: Standalone JS files in /api folder
   - minimal.js: Ultra-simple API endpoint for basic testing
   - diagnostics.js: Environment and database diagnostics
   - health.js: Simple health check
   - test.js: Environment variable test
   - app.js: Main API handler

### 4. Progressive Testing Strategy

Test in this specific order to isolate issues:

1. **Static HTML**: First test https://yourdomain.vercel.app/vercel-test.html
   - This verifies basic static file serving with no server-side code

2. **Simple API**: Test https://yourdomain.vercel.app/api/minimal
   - This tests the most basic serverless function without database

3. **Diagnostics**: Check https://yourdomain.vercel.app/api/diagnostics
   - This shows environment variables and basic configuration

4. **Full Application**: Only after above tests pass, try the main app

### 5. Fixing "FUNCTION_INVOCATION_FAILED" Errors

If you see 500 errors with "FUNCTION_INVOCATION_FAILED":

1. **Database Connection**: Most common cause - check if Supabase allows Vercel's IP addresses
2. **Memory Limits**: We've increased to 1024MB in vercel.json
3. **Execution Time**: We've increased to 10 seconds in vercel.json
4. **Cold Starts**: First request might fail, retry after a minute
5. **See Full Guide**: Check vercel_error_fix_guide.md for detailed troubleshooting

### 6. Optimizing Database Connections

For PostgreSQL databases in serverless environments:

1. **Connection Pooling**: Enable connection pooling in Supabase
2. **Connection Limits**: Serverless functions can quickly exhaust connections
3. **Implement Retries**: Add retry logic for transient connection failures
4. **Add Timeouts**: Set explicit timeouts to avoid hanging connections

### 7. Manual Testing With cURL

Test the API endpoints:

```bash
# Test minimal API endpoint
curl https://yourdomain.vercel.app/api/minimal

# Test diagnostics endpoint
curl https://yourdomain.vercel.app/api/diagnostics

# Test health endpoint
curl https://yourdomain.vercel.app/api/health
```

### 8. Vercel Dashboard Debugging

Use Vercel's dashboard for deeper debugging:

1. Go to Functions tab to see specific function errors
2. Check the deployment logs for build errors
3. Look at the function invocation details for runtime errors
4. Note the specific function ID when contacting support

If all else fails, see the detailed troubleshooting guide in vercel_error_fix_guide.md.