# ChickFarms Vercel Deployment Checklist

## Overview

This checklist ensures your ChickFarms application deploys correctly to Vercel with all API routes properly configured, especially the spin functionality.

## Pre-Deployment Checklist

- [ ] Environment variables are set correctly
  - [ ] `NODE_ENV` set to "production"
  - [ ] `DATABASE_URL` points to a PostgreSQL database
  - [ ] `SESSION_SECRET` is set with a secure random string
  - [ ] `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET_KEY` are set
  
- [ ] Configuration files are up-to-date
  - [ ] Run `node prepare-for-vercel.js` to update route configurations
  - [ ] Verify `vercel.json` has correct route order (specific routes before general ones)
  - [ ] Ensure `.vercel/output/config.json` has matching route configuration (if it exists)
  
- [ ] API routes are properly consolidated
  - [ ] Verify `api/consolidated.cjs` exists and includes all API route handlers
  - [ ] Check `/api/debug-spin` endpoint is included
  - [ ] All spin-related endpoints are properly routed with auth middleware

## Build Process

- [ ] Run correct build script
  - [ ] Use `node build-vercel.js && npm run build` or deploy via GitHub integration with Vercel
  - [ ] Verify build output doesn't exceed Vercel Hobby plan limits (12 serverless functions)

- [ ] HTML files are excluded correctly
  - [ ] Verify `.vercelignore` includes `public/*.html`
  - [ ] Confirm static HTML files won't override React app

## Critical Routes Order

The following route order must be maintained in both `vercel.json` and `.vercel/output/config.json`:

1. `/api/debug-spin`
2. `/api/spin/status`
3. `/api/spin/spin`
4. `/api/spin/claim-extra`
5. `/api/spin/(.*)`
6. `/api/(.*)`
7. `/(.*)`

## Post-Deployment Verification

- [ ] Static assets
  - [ ] Verify React app loads correctly
  - [ ] Static assets (images, CSS, JS) are accessible
  
- [ ] Authentication
  - [ ] Test login functionality
  - [ ] Verify protected routes require authentication
  
- [ ] API functionality
  - [ ] `/api/health` endpoint returns 200 OK
  - [ ] `/api/debug-spin` provides detailed environment information
  - [ ] `/api/spin/status` returns user's spin status when authenticated
  - [ ] Spin functionality works correctly with authentication
  
- [ ] Run test script
  - [ ] Set `PRODUCTION_URL` to your Vercel deployment URL
  - [ ] Run `node test-spin-endpoints.js` to compare local and production

## Troubleshooting Common Issues

### Authentication Issues
- Verify cookie settings match between local and production
- Check `secure` and `sameSite` cookie settings in `server/auth.ts`
- Ensure SESSION_SECRET is consistent between deployments

### 404 Errors on API Routes
- Verify route ordering in Vercel configuration
- Add explicit routes for specific endpoints (like we did for spin endpoints)
- Check the server logs in Vercel dashboard for detailed error messages

### Function Size Limits
- If hitting function size limits, further consolidate API routes
- Remove unnecessary dependencies from serverless functions

## Additional Resources

- `test-spin-api.js` - Test script for spin functionality
- `test-consolidated-api.js` - Test script for consolidated API endpoints
- `prepare-for-vercel.js` - Utility to prepare configuration for Vercel deployment
- `VERCEL_DEPLOYMENT_SPIN_DEBUG_GUIDE.md` - Detailed guide for debugging spin issues on Vercel

## Final Verification

Before considering deployment complete, verify the following in production:

1. Visit the hosted site and log in
2. Navigate to the spin feature and check if status loads 
3. Check the browser console for any API errors
4. Verify all functionality works as expected

If issues persist, use the debug endpoint (`/api/debug-spin`) to gather more information about the environment and configuration.