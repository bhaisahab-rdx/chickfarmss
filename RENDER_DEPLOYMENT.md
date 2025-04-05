# Deploying ChickFarms on Render

Render offers a straightforward deployment experience that works well with Node.js applications like ChickFarms.

## Step 1: Create a Render Account

1. Go to [render.com](https://render.com)
2. Sign up for an account if you don't have one

## Step 2: Create a New Web Service

1. Log in to your Render dashboard
2. Click on "New" and select "Web Service"
3. Connect your GitHub repository or upload your code directly

## Step 3: Configure Your Web Service

Configure the following settings:

- **Name**: ChickFarms
- **Runtime**: Node
- **Build Command**: `node build.js`
- **Start Command**: `node server.js`
- **Plan**: Choose the appropriate plan (Free tier works for testing)

## Step 4: Set Environment Variables

In the "Environment" section, add these variables:

- `NODE_ENV`: `production`
- `SESSION_SECRET`: Generate a random string
- `DATABASE_URL`: Leave blank for now (we'll set this after creating the database)

## Step 5: Create a PostgreSQL Database

1. In the Render dashboard, click "New" again
2. Select "PostgreSQL"
3. Configure your database settings:
   - **Name**: chickfarms-db
   - **User**: Leave as default
   - **Database**: chickfarms
   - Choose the appropriate plan

4. After creation, Render will provide you with:
   - Database URL
   - Username
   - Password
   - Host

## Step 6: Connect Your Database

1. Go back to your web service settings
2. In the "Environment" section, update the `DATABASE_URL` variable with the connection string from your PostgreSQL service
   - Format: `postgres://username:password@host:port/database`

## Step 7: Add Payment API Keys

In your web service "Environment" section, add:

- `NOWPAYMENTS_API_KEY`: Your payment API key
- `NOWPAYMENTS_IPN_SECRET_KEY`: Your payment webhook secret

## Step 8: Deploy

1. Click "Create Web Service" or "Save Changes" if you're updating an existing service
2. Render will automatically start the deployment process
3. Wait for the build and deploy process to complete (this may take a few minutes)

## Step 9: Initialize the Database

Once your service is deployed:

1. Go to the "Shell" tab of your web service
2. Run: `npx drizzle-kit push`
3. This will create all necessary database tables based on your schema

## Step 10: Verify Deployment

1. After deployment completes, Render will provide you with a URL
2. Visit the URL to check if your application is running correctly
3. Test all key features to make sure everything is working

## Troubleshooting

### If Your App Fails to Start

1. Check the logs in the "Logs" tab of your web service
2. Look for any error messages that might indicate the issue

### If Database Connection Fails

1. Verify that your PostgreSQL service is running
2. Check that the `DATABASE_URL` environment variable is set correctly
3. Make sure your web service can access your database (they should be in the same region)

### If Assets Are Not Loading

1. Make sure the build process completed successfully
2. Check that static files are being served correctly from the `dist/public` directory

## Auto-Deployment

Render supports automatic deployments when you push to your repository:

1. Go to your web service settings
2. Under "Build & Deploy", enable "Auto-Deploy"
3. Future pushes to your repository will trigger automatic deployments
