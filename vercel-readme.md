# ChickFarms Vercel Deployment Guide

## Deployment Setup

Follow these steps to properly deploy ChickFarms to Vercel:

### 1. Project Settings in Vercel Dashboard

- **Framework Preset**: Select "Custom" (or "Other" if Custom isn't available)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 2. Environment Variables

Make sure the following environment variables are set in your Vercel project:

```
DATABASE_URL=postgresql://postgres:thekinghu8751@db.zgsyciaoixairqqfwvyt.supabase.co:5432/postgres
SESSION_SECRET=,Y1#!e&yGr-.%;Zb7X*W](YJ=DyE-F
NODE_ENV=production
NOWPAYMENTS_API_KEY=JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3
NOWPAYMENTS_IPN_SECRET_KEY=A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um
```

### 3. Testing the Deployment

After deploying, verify these endpoints to ensure the application is working correctly:

- **Static Assets**: https://chiket.vercel.app/health.html
- **Basic API Health**: https://chiket.vercel.app/api/health
- **API Test Endpoint**: https://chiket.vercel.app/api/test
- **API Root**: https://chiket.vercel.app/api

### 4. Troubleshooting

If you encounter issues:

1. **Check Vercel Logs**: Review build and runtime logs in the Vercel dashboard
2. **Verify Environment Variables**: Ensure all required environment variables are set correctly
3. **CORS Issues**: If API calls fail from frontend, ensure the CORS configuration includes your domain
4. **Database Connection**: Make sure the database URL is correct and the database is accessible from Vercel's servers

### 5. Manual Test with cURL

You can test the API with cURL commands:

```bash
# Test health endpoint
curl https://chiket.vercel.app/api/health

# Test main API endpoint
curl https://chiket.vercel.app/api

# Test diagnostic endpoint
curl https://chiket.vercel.app/api/test
```

### 6. Contact Support

If you continue to experience issues after following these steps, contact Vercel support for assistance.