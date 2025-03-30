# ChickFarms Vercel Deployment Guide

This guide provides comprehensive instructions for deploying the full ChickFarms React application to Vercel, ensuring that all features work correctly, including authentication.

> **IMPORTANT NOTE**: This deployment configuration has been updated to ensure ONLY the React game will appear in your deployment. The simplified HTML game has been completely removed from the deployment process.

## Prerequisites

1. A Vercel account (https://vercel.com/signup)
2. The ChickFarms codebase
3. Access to the PostgreSQL database

## Step 1: Prepare Your Project

1. Ensure your project is working correctly locally before attempting deployment
2. Verify that authentication is working using the credentials:
   - Username: adminraja
   - Password: admin8751

## Step 2: Set Up Vercel Configuration

The `vercel.json` file has been updated to correctly handle the ChickFarms application. The key changes include:

```json
{
  "version": 2,
  "buildCommand": "node build-vercel.js && npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/api/auth/(.*)", "destination": "/api/consolidated.js" },
    { "source": "/api/user", "destination": "/api/consolidated.js" },
    { "source": "/api/login", "destination": "/api/consolidated.js" },
    { "source": "/api/register", "destination": "/api/consolidated.js" },
    { "source": "/api/logout", "destination": "/api/consolidated.js" },
    { "source": "/api/(.*)", "destination": "/api/consolidated.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "env": {
    "NODE_ENV": "production",
    "DATABASE_URL": "postgresql://postgres.zgsyciaoixairqqfwvyt:thekinghu8751@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
    "SESSION_SECRET": "w8smRGPCRnWFtBSPf9cD",
    "NOWPAYMENTS_API_KEY": "JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3",
    "NOWPAYMENTS_IPN_SECRET_KEY": "A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um"
  }
}
```

### Key Changes Explained:

1. **Build Command**: Uses `build-vercel.js` to prepare the code followed by the standard build process
2. **Output Directory**: Sets the output to `dist` folder where the built files will be located
3. **Rewrites**: 
   - Routes authentication-related API endpoints to the consolidated.js serverless function
   - Routes all other requests to index.html to ensure the React app can handle client-side routing
4. **Environment Variables**: Sets all the required environment variables for the application

## Step 3: Deploy to Vercel

1. Log in to your Vercel account
2. From the dashboard, click "New Project"
3. Import your ChickFarms Git repository
4. Configure the project:
   - Build Command: Leave blank (will use the one in vercel.json)
   - Output Directory: Leave blank (will use the one in vercel.json)
   - Environment Variables: These will be loaded from vercel.json but can be overridden here
5. Click "Deploy"

## Step 4: Verify Deployment

Once the deployment is complete, verify that:

1. The React application loads correctly with styling and assets
2. Authentication works (login and registration)
3. Game features are operational
4. API endpoints are accessible and working correctly

Use the `/api/diagnostics` endpoint to check:
- Environment variables are set correctly
- Database connection is working
- Server is running in production mode

## Step 5: Debugging Common Issues

### Authentication Not Working

If you experience authentication issues:

1. Check that the consolidated.js API handler is correctly routing authentication requests
2. Verify that the necessary auth routes are included in the rewrites section of vercel.json
3. Check the browser console for CORS or API errors
4. Make sure the SESSION_SECRET environment variable is set correctly

### Blank Screen or Missing Assets

If you see a blank screen or missing assets:

1. Verify that the build was completed successfully
2. Check that all JavaScript and CSS files are being loaded correctly (browser console)
3. Make sure the rewrite rules are directing all non-API requests to index.html

### API Errors

If API endpoints are not working:

1. Test the `/api/health` endpoint to verify basic API functionality
2. Check that the DATABASE_URL environment variable is correct and accessible
3. Review the vercel.json configuration for proper API routing
4. Verify that the consolidated.js handler is working correctly

## Additional Notes

- **Serverless Function Limits**: Vercel's Hobby plan has a 12-function limit. The consolidated.js approach helps stay within this limit.
- **Cold Starts**: Serverless functions may experience cold starts. Consider adding a keep-warm function if necessary.
- **Database Connection Pooling**: The database connection is handled via a pooling mechanism to maintain efficient connections.
- **Environment Variables**: Sensitive values should be added through the Vercel UI rather than in version-controlled files in production.

## Conclusion

Following this guide should result in a successful deployment of the ChickFarms React application to Vercel. If you encounter any issues that aren't covered here, refer to the Vercel documentation or contact Vercel support for assistance.