# Vercel Deployment Final Checklist

This checklist helps ensure the ChickFarms application is successfully deployed on Vercel with all critical functionality working correctly.

## Pre-Deployment Checks

- [ ] Run `node verify-deployment-config.js` to verify your Vercel configuration
- [ ] Verify all needed environment variables are set in `.env.production`
  - [ ] `NODE_ENV=production`
  - [ ] `DATABASE_URL` is set to the production database URL
  - [ ] `SESSION_SECRET` has a secure random value
  - [ ] `NOWPAYMENTS_API_KEY` and `NOWPAYMENTS_IPN_SECRET_KEY` are set (if payment integration is used)
- [ ] Ensure the vercel.json configuration is correct
  - [ ] `builds` section properly configures client and API
  - [ ] `routes` section includes all necessary routes, especially `/api/spin/(.*)` routes
- [ ] Run `node test-consolidated-api.js` to test API functionality locally
- [ ] Run `node test-spin-api.js` to verify spin functionality locally

## Build Process Checks

- [ ] Run `node build-vercel.js` to generate the Vercel deployment files
- [ ] Verify the build output in `.vercel/output/static`
- [ ] Check `.vercel/output/functions/api.func/index.js` for correct consolidated API implementation
- [ ] Verify `.vercel/output/config.json` includes proper routing for all API endpoints, especially spin routes

## Deployment Monitoring

- [ ] After deploying to Vercel, check the deployment logs for errors
- [ ] Verify the website loads correctly at the deployment URL
- [ ] Test login functionality with admin credentials
- [ ] Verify authenticated routes require login
- [ ] Check that the spin feature loads and functions correctly
- [ ] Verify the debug endpoint at `/api/debug-spin` returns valid data
- [ ] Check the function logs in Vercel for any errors in the spin routes

## Troubleshooting Common Issues

### 404 Error on Spin Endpoints

If spin endpoints return 404 errors, check:

1. The route patterns in `.vercel/output/config.json`
   ```json
   {
     "src": "/api/spin/(.*)",
     "dest": "/api"
   }
   ```

2. Make sure this route comes BEFORE the general API route to prevent incorrect matching:
   ```json
   {
     "src": "/api/(.*)",
     "dest": "/api"
   }
   ```

3. Check that the consolidated API handler correctly processes spin routes in the pathname matching logic

### Authentication Issues

If authentication is failing:

1. Verify that cookies are being set correctly with proper domain settings
2. Check that `SESSION_SECRET` is identical between development and production
3. Verify that the session token validation logic works correctly
4. Test logging in with known good credentials
5. Check for CORS issues if users can't log in

### Database Connection Problems

If database operations fail:

1. Verify the `DATABASE_URL` is correctly set in environment variables
2. Check that the database is accessible from Vercel's servers
3. Verify that any database migrations have been properly applied
4. Test database connectivity using the debug endpoint
5. Check if database connection pool settings need adjustments for serverless environment

## Final Validation Steps

- [ ] Verify all user flows work end-to-end
- [ ] Test on multiple browsers and devices
- [ ] Check performance metrics in Vercel dashboard
- [ ] Monitor error rates after deployment
- [ ] Create regular database backups
- [ ] Document any ongoing issues or future improvements