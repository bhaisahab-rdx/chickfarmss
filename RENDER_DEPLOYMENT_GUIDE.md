# ChickFarms Render Deployment Guide (Updated March 2025)

This guide provides detailed instructions for deploying the ChickFarms application to Render's hosting platform, with fixes for the most common deployment issues.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com) if you don't have one)
2. Access to the ChickFarms GitHub repository or the code files
3. Database credentials for the PostgreSQL database

## Updated Deployment Configuration (March 2025)

We've significantly improved the deployment configuration to fix common issues with the Vite build process and ESM imports. Key improvements include:

1. **Enhanced build script**: Using a comprehensive `render-build.js` script that handles dependency installation, environment setup, and verification steps
2. **Simplified server.js**: Better handling of ESM/CJS compatibility with detailed error logging
3. **Fixed module issues**: Properly handling ES modules in the Node.js environment

## Deployment Steps

### 1. Prepare Your Project

The project has already been configured for deployment with:
- `render.yaml` configuration file (updated for reliability)
- `server.js` production server file (enhanced for compatibility) 
- `render-build.js` comprehensive build script (NEW)

### 2. Deploy on Render

#### Option 1: Deploy via GitHub Integration (Recommended)

1. Log in to your Render dashboard
2. Click "New" and select "Blueprint" from the dropdown menu
3. Connect your GitHub account if you haven't already
4. Select the ChickFarms repository
5. Render will automatically detect the `render.yaml` file and set up your services
6. Review the settings and click "Apply"

> **Note**: The deployment uses our enhanced `render-build.js` script which handles installing all required dependencies (including dev dependencies), sets up the proper environment, and includes verification steps to ensure all build tools are properly installed.

#### Option 2: Manual Deployment (With Enhanced Build Process)

1. Log in to your Render dashboard
2. Click "New" and select "Web Service" from the dropdown menu
3. Connect to your GitHub repository or upload the files directly
4. Configure the following settings:
   - **Name**: chickfarms
   - **Environment**: Node.js
   - **Build Command**: `node render-build.js`
   - **Start Command**: `node server.js`
5. Under "Advanced" settings, add the following environment variables:
   - `NODE_ENV`: production
   - `PORT`: 10000
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `SESSION_SECRET`: A secure random string for session encryption
   - `NOWPAYMENTS_API_KEY`: Your NOWPayments API key
   - `NOWPAYMENTS_IPN_SECRET_KEY`: Your NOWPayments IPN secret key
6. Click "Create Web Service"

### 3. Configure Environment Variables

Ensure that you have set the following environment variables in the Render dashboard:

| Variable Name | Description | Required |
|---------------|-------------|----------|
| `NODE_ENV` | Set to `production` | Yes |
| `PORT` | Set to `10000` (Render will automatically assign a port) | No |
| `DATABASE_URL` | Your PostgreSQL connection string | Yes |
| `SESSION_SECRET` | Secret for encrypting session data | Yes |
| `NOWPAYMENTS_API_KEY` | API key for NOWPayments integration | For payment functionality |
| `NOWPAYMENTS_IPN_SECRET_KEY` | IPN secret key for NOWPayments | For payment functionality |

### 4. Database Setup

1. You can either:
   - Create a new PostgreSQL database on Render
   - Use an existing external PostgreSQL database
2. Get your database connection string
3. Add it as the `DATABASE_URL` environment variable in your Render service

#### Database Migration

To migrate your existing data to Render:

1. Run the included backup script to create an SQL backup:
   ```
   node backup-db-for-render.js
   ```
2. This will create a `render-database-backup.sql` file with all your data
3. In the Render dashboard, go to your PostgreSQL database
4. Use the "Import from SQL" feature to import this file

### 5. Verify Deployment

1. Once deployed, visit your application URL (provided by Render)
2. Test the API health endpoint: `https://your-render-url.onrender.com/api/health`
3. Verify that the frontend loads correctly
4. Test key functionality like authentication, game mechanics, and payments

### Troubleshooting Common Issues

If you encounter any issues with your deployment, check the following:

#### Build Errors

1. **"Cannot find package 'vite' imported from..."**
   - This is fixed in our enhanced render-build.js script which properly installs all required build dependencies
   - Solution: Use `node render-build.js` as your build command
   
2. **"ERR_MODULE_NOT_FOUND" or "Unknown file extension .ts"**
   - Caused by ES Module compatibility issues in production
   - Solution: Our updated server.js handles this with proper module loading detection
   
3. **"command not found" (status 127)**
   - Happens when build tools aren't available in the build environment
   - Solution: The render-build.js script now checks and installs tools globally if needed

#### Runtime Errors

1. **"Cannot find module './dist/...'"**
   - Check that the build completed successfully and generated files in the dist directory
   - Review logs to make sure esbuild ran without errors
   
2. **Database Connection Issues**
   - Verify your DATABASE_URL is correctly set in the Render environment variables
   - Check that the database is accessible from Render's IP ranges
   
3. **API Errors or Blank Pages**
   - Check server logs for detailed error messages
   - Verify that all environment variables are correctly set
   - Test the API health endpoint to ensure the server is running

#### Emergency Fixes

If you're still having issues:

1. Use the Render Shell tab to access your deployment environment
2. Run `NODE_ENV=production node render-build.js` manually
3. Verify the dist directory contents with `ls -la dist`
4. Check for errors in the server logs with `tail -f /var/log/render/app.log`
5. Test the server in development mode with `NODE_ENV=development node server.js`

### Maintaining Your Deployment

For ongoing maintenance:

1. **Automatic Deploys**: The `render.yaml` has `autoDeploy: true` to automatically deploy new changes
2. **Scaling**: Adjust the instance type in the Render dashboard if you need more resources
3. **Monitoring**: Use Render's built-in monitoring tools to track performance
4. **Database Backups**: Set up regular backups of your PostgreSQL database

## Support

If you encounter any deployment issues, please:
1. Check the Render documentation at https://render.com/docs
2. Review Render's Node.js deployment guide at https://render.com/docs/deploy-node-express-app
3. Contact the ChickFarms development team for application-specific issues