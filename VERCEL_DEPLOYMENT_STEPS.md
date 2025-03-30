# ChickFarms Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the ChickFarms application to Vercel, ensuring that authentication and all API features work correctly.

## Preparation Steps

1. **Verify your project is ready for deployment**
   - Run `node verify-deployment-config.js` to check that your project is configured correctly
   - Ensure all authentication fixes from `VERCEL_AUTH_API_FIX.md` are in place
   - Make sure your database connection string is correct in the `.env` file

2. **Build your project locally**
   - Run the build scripts to prepare your code:
   ```bash
   node build-vercel.js && node vercel-api-build.js
   ```
   - This ensures all imports have proper extensions and API endpoints are configured correctly

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard

1. **Create a new project in the Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com) and log in
   - Click "New Project" and import your GitHub repository

2. **Configure the build settings**
   - Framework Preset: Other
   - Build Command: `node build-vercel.js && node vercel-api-build.js`
   - Output Directory: `public`
   - Install Command: `npm install`

3. **Add environment variables**
   - NODE_ENV = production
   - DATABASE_URL = postgresql://postgres.zgsyciaoixairqqfwvyt:thekinghu8751@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
   - SESSION_SECRET = w8smRGPCRnWFtBSPf9cD
   - NOWPAYMENTS_API_KEY = JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3
   - NOWPAYMENTS_IPN_SECRET_KEY = A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um

4. **Deploy**
   - Click "Deploy" and wait for the deployment to complete

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Log in to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from the project directory**
   ```bash
   vercel --prod
   ```

4. **Follow the prompts**
   - Use the same build settings and environment variables mentioned above

## Post-Deployment Verification

After deployment, verify that everything works correctly:

1. **Access your application**
   - Go to your Vercel deployment URL (e.g., `https://chickfarms.vercel.app`)

2. **Test the API**
   - Visit `/api/health` to verify basic API functionality
   - Visit `/api/diagnostics` to check environment variables and database connection

3. **Test authentication**
   - Try logging in with an existing account
   - Test registration of a new account
   - Verify that authenticated routes work after login

4. **Run the comprehensive test**
   - Visit `/api/test-deployment` for a comprehensive test of all functionality
   - Visit `/vercel-test.html` for an interactive test dashboard

## Troubleshooting

If you encounter issues with your deployment, try these steps:

### Authentication Issues

1. **Check session cookies**
   - Make sure cookies are being set correctly
   - Verify that the `session` cookie is present after login
   - Check browser console for any CORS or cookie-related errors

2. **Test direct API access**
   - Use a tool like Postman or curl to test the authentication endpoints directly
   ```bash
   curl -X POST https://your-app.vercel.app/api/login -d '{"username":"adminraja","password":"admin8751"}' -H "Content-Type: application/json"
   ```

### Database Connection Issues

1. **Verify environment variables**
   - Double-check your DATABASE_URL in the Vercel dashboard
   - Make sure your database allows connections from Vercel's IP addresses

2. **Check database logs**
   - Look for connection errors in your database logs
   - Verify that the database is online and accepting connections

### API Route Issues

1. **Check Vercel function logs**
   - Go to the Vercel dashboard > Your project > Deployments > Functions
   - Check logs for any errors in the API functions

2. **Verify route configuration**
   - Make sure your vercel.json file is correctly routing requests
   - Test individual API endpoints to isolate any issues

## Need More Help?

If you continue to experience issues, contact the development team or reference these additional resources:

- Check the `VERCEL_AUTH_API_FIX.md` file for details on the authentication implementation
- Review `VERCEL_FUNCTION_LIMIT_FIX.md` for information about the consolidated API approach
- See the Vercel documentation at [vercel.com/docs](https://vercel.com/docs) for more information