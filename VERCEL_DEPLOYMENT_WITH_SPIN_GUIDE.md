# ChickFarms Vercel Deployment Guide with Spin Fix

This guide provides step-by-step instructions for deploying ChickFarms to Vercel with proper spin functionality. Follow these steps carefully to ensure successful deployment.

## Prerequisites

- A Vercel account
- ChickFarms codebase with all changes

## Step 1: Prepare the Project

Before deploying, run these preparation scripts to ensure proper configuration:

```bash
# Run the enhanced preparation script
node prepare-for-vercel.js

# Run the build script
node build-vercel.js
```

These scripts will:
- Update route configurations in vercel.json
- Set up proper API routes with correct ordering
- Create the necessary Vercel output structure

## Step 2: Configure Vercel Project Settings

In the Vercel Dashboard:

1. Create a new project or select your existing ChickFarms project
2. Under "Framework Preset", select **Other** (not Next.js)
3. Configure build settings:
   - Build Command: `node build-vercel.js`
   - Output Directory: `.vercel/output`
   - Install Command: `npm install`
4. Add environment variables:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure random string for session encryption
   - `NODE_ENV`: Set to `production`
   - `NOWPAYMENTS_API_KEY` (if using NOWPayments)
   - `NOWPAYMENTS_IPN_SECRET_KEY` (if using NOWPayments)
5. Under Advanced Settings, set Node.js Version to 18.x or higher

## Step 3: Deploy

Click "Deploy" and wait for the build process to complete.

## Step 4: Verify Deployment

After deployment is complete, test the following endpoints to verify everything is working:

1. `/api/vercel-debug` - Should return detailed information about the environment
2. `/api/debug-spin` - Should return information about the spin configuration
3. `/api/health` - Should return status "ok"
4. Login to your application and test the spin functionality

## Troubleshooting

If you encounter 404 errors for spin endpoints:

1. Visit `/api/vercel-debug` to check if routes are configured correctly
2. Check the Vercel function logs for detailed error messages
3. Verify that the session cookie is being set correctly
4. Try using JWT authentication instead of cookie-based authentication by modifying the client code

## Advanced Debugging

Use these environment variables for enhanced debugging:

```
VERCEL_DEBUG=true
DEBUG_SPIN=true
```

Add these to your Vercel project settings to get more detailed logs.

## Route Priority

The critical part of this deployment is ensuring the spin routes have higher priority. The proper order is:

1. `/api/vercel-debug`
2. `/api/debug-spin`
3. `/api/spin/status`
4. `/api/spin/spin`
5. `/api/spin/claim-extra`
6. `/api/spin/(.*)`
7. `/api/(.*)`

This order is automatically handled by the `prepare-for-vercel.js` script.

## Known Issues

If you're still encountering issues with Vercel deployment, consider these alternatives:

1. **Render.com**: Offers a more traditional server setup without serverless constraints
2. **Railway.app**: Better support for Express applications with PostgreSQL
3. **DigitalOcean App Platform**: More reliable for Express applications with complex routing