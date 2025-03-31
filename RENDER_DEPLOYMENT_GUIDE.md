# ChickFarms Render Deployment Guide

This guide provides detailed instructions for deploying the ChickFarms application to Render's hosting platform.

## Prerequisites

1. A Render account (sign up at [render.com](https://render.com) if you don't have one)
2. Access to the ChickFarms GitHub repository or the code files
3. Database credentials for the PostgreSQL database

## Deployment Steps

### 1. Prepare Your Project

The project has already been configured for deployment with:
- `render.yaml` configuration file
- `server.js` production server file
- `Procfile` for process management

### 2. Deploy on Render

#### Option 1: Deploy via GitHub Integration (Recommended)

1. Log in to your Render dashboard
2. Click "New" and select "Blueprint" from the dropdown menu
3. Connect your GitHub account if you haven't already
4. Select the ChickFarms repository
5. Render will automatically detect the `render.yaml` file and set up your services
6. Review the settings and click "Apply"

#### Option 2: Manual Deployment

1. Log in to your Render dashboard
2. Click "New" and select "Web Service" from the dropdown menu
3. Connect to your GitHub repository or upload the files directly
4. Configure the following settings:
   - **Name**: chickfarms
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
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

### Troubleshooting

If you encounter any issues with your deployment, check the following:

1. **Deployment Logs**: Review the build and runtime logs in the Render dashboard
2. **Environment Variables**: Ensure all required environment variables are set correctly
3. **Database Connection**: Verify that the database connection is working
4. **API Errors**: Check server logs for any API errors or exceptions

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