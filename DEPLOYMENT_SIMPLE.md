# Simple ChickFarms Deployment Guide

This guide provides a straightforward approach to deploy ChickFarms without relying on complex configuration files.

## Prerequisites

- Node.js 16 or higher
- PostgreSQL database
- Basic knowledge of command line

## Step 1: Build the Application

Before deployment, build the application locally:

```bash
# Run the build script
node build.js
```

This will create the `dist` directory with all necessary compiled files.

## Step 2: Prepare Your Server

On your hosting platform (Render, Heroku, DigitalOcean, etc.):

1. Create a new web service
2. Select "Manual Deploy" or equivalent option
3. Choose Node.js as the runtime

## Step 3: Deployment Commands

Configure these commands in your deployment platform:

**Build Command:**
```
node build.js
```

**Start Command:**
```
NODE_ENV=production node server.js
```

## Step 4: Environment Variables

Set these environment variables in your deployment platform:

- `DATABASE_URL`: Your PostgreSQL connection string
- `SESSION_SECRET`: Random string for session encryption
- `NODE_ENV`: Set to `production`
- `PORT`: Let your platform set this, or use 10000 as fallback
- `NOWPAYMENTS_API_KEY`: Your payments API key
- `NOWPAYMENTS_IPN_SECRET_KEY`: Your payments webhook secret

## Step 5: Database Setup

Connect to your database and run the initial migration:

```bash
# Make sure you're connected to your database
npx drizzle-kit push
```

## Step 6: Manual Deployment Steps

If your platform requires manual uploading:

1. Zip your entire project directory (excluding node_modules)
2. Upload the zip file to your hosting platform
3. Follow their instructions to deploy from the uploaded files

## Step 7: Verify Deployment

1. Check server logs for any startup errors
2. Test the application by accessing the URL provided by your platform
3. Verify all major features are working correctly:
   - Login
   - Game features
   - Payments
   - Referral system

## Troubleshooting Common Issues

1. **Module not found errors:**
   - Check if all dependencies are properly installed
   - Verify the file paths in imports are correct

2. **Database connection issues:**
   - Verify the DATABASE_URL environment variable is set correctly
   - Check if your database is accessible from your hosting platform
   - Database might need whitelisting your server's IP

3. **Static files not loading:**
   - Ensure the `dist/public` directory contains all necessary assets
   - Check server.js paths for serving static files

4. **Memory issues:**
   - Most platforms offer a way to increase allocated memory if needed
