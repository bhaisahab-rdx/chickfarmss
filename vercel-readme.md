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
   - Important: The catch-all route `/(.*) -> /index.html` must include Content-Type header
   
2. **.vercelignore**: Prevents unnecessary files from being uploaded
   - Include node_modules, .git, etc.

3. **API Handlers**: Standalone JS files in /api folder
   - health.js: Simple health check
   - test.js: Environment variable test
   - app.js: Main API handler

### 4. Testing the Deployment

After deploying, verify these endpoints in order:

1. **Static File**: https://chiket.vercel.app/vercel-test.html
2. **API Health**: https://chiket.vercel.app/api/health
3. **API Diagnostics**: https://chiket.vercel.app/api/diagnostics
4. **Full Frontend**: https://chiket.vercel.app/

### 5. Troubleshooting

If you see raw HTML or JavaScript code displayed instead of a rendered page:

1. **Content-Type Issue**: Check vercel.json to ensure the catch-all route includes content-type header
2. **Routing Problem**: Verify that the route order in vercel.json is correct (API routes first, filesystem second, catch-all last)
3. **Build Output**: Confirm that the correct build output is being generated in the dist folder
4. **Browser Cache**: Try opening the site in an incognito window or clearing your browser cache

### 6. Database Connectivity

1. **IP Allowlist**: Make sure your database (Supabase) allows connections from Vercel's IP addresses
2. **Connection Pooling**: Consider enabling connection pooling for better performance
3. **Test Connection**: Use the API diagnostics endpoint to verify database connectivity

### 7. Manual Testing

Test the API with cURL commands:

```bash
# Test health endpoint
curl https://chiket.vercel.app/api/health

# Test diagnostics endpoint
curl https://chiket.vercel.app/api/diagnostics

# Test API entry point
curl https://chiket.vercel.app/api
```

### 8. Final Checklist Before Going Live

- Verify all API endpoints are working
- Test authentication flow
- Ensure database connections are stable
- Test the payment processing system
- Verify CORS settings allow connections from your domain

If issues persist after following these steps, review the Vercel build logs for specific error messages or contact Vercel support for assistance.