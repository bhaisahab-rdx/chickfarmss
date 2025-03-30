# ChickFarms Vercel Deployment Checklist

Use this checklist to verify that your ChickFarms application has been correctly deployed to Vercel.

> **IMPORTANT**: This configuration ensures that ONLY the full React application will be deployed to Vercel. The simplified HTML game has been completely removed from the deployment process.

## Pre-Deployment Checks

- [ ] Local application works correctly with authentication, game features, etc.
- [ ] Project has all required dependencies installed
- [ ] Database is properly configured and accessible
- [ ] Environment variables are defined in vercel.json or ready to be added during deployment
- [ ] vercel.json is set up with proper configuration for the full React application

## Environment Variable Checks

Ensure the following environment variables are set in Vercel:

- [ ] `DATABASE_URL` - Connection string to your PostgreSQL database
- [ ] `NODE_ENV` - Set to "production"
- [ ] `SESSION_SECRET` - Secret key for session encryption  
- [ ] `NOWPAYMENTS_API_KEY` - API key for NOWPayments integration (if applicable)
- [ ] `NOWPAYMENTS_IPN_SECRET_KEY` - IPN secret for NOWPayments (if applicable)

## Deployment Process Checks

- [ ] Code is pushed to a Git repository (GitHub, GitLab, or Bitbucket)
- [ ] Vercel project created and connected to repository
- [ ] Build settings configured correctly (buildCommand in vercel.json)
- [ ] Output directory set correctly (outputDirectory in vercel.json)
- [ ] Deployment completes successfully without build errors

## Post-Deployment Verification

### Basic Functionality

- [ ] Main application landing page loads correctly
- [ ] Static assets (images, CSS, JavaScript) load without 404 errors
- [ ] Page routing works correctly between different app sections

### Authentication

- [ ] Login page loads and form works
- [ ] Can successfully log in with test credentials (adminraja/admin8751)
- [ ] User session persists after page refresh
- [ ] Logout function works correctly
- [ ] Protected routes require authentication

### API Functionality

- [ ] `/api/health` endpoint returns 200 OK status
- [ ] `/api/diagnostics` confirms environment variables and database connection
- [ ] Game-specific API endpoints work correctly
- [ ] Authentication API endpoints work (/api/login, /api/user, etc.)

### Game Features

- [ ] Dashboard displays correctly after login
- [ ] Farm/Chicken management features work
- [ ] Transactions and wallet balance display correctly
- [ ] Referral system works (if implemented)
- [ ] Daily spin and rewards function properly

## Common Error Resolution

If any of the above checks fail, refer to these resources:

- **Authentication Issues**: See VERCEL_AUTH_TROUBLESHOOTING.md
- **Deployment Issues**: See VERCEL_FULL_REACT_DEPLOYMENT_GUIDE.md
- **API Issues**: Test endpoints using browser developer tools or Postman
- **React App Issues**: Check browser console for JavaScript errors

## Final Check

Visit these URLs to verify that all components are working correctly:

- **Main App**: https://[your-vercel-domain].vercel.app/
- **Health Check**: https://[your-vercel-domain].vercel.app/api/health
- **Diagnostics**: https://[your-vercel-domain].vercel.app/api/diagnostics

## Notes

- Remember that Vercel's serverless functions have cold starts, so the first request may be slower than subsequent ones.
- The free tier of Vercel has limitations on bandwidth, build time, and function execution time. For production deployments, consider upgrading your plan.
- Verify that your database is properly configured to accept connections from Vercel's IP ranges.