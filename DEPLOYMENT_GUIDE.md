# ChickFarms Deployment Guide

This guide provides simple instructions for deploying your ChickFarms application to various hosting platforms.

## Preparing Your Application

1. Build your application locally first:
   ```
   node build.js
   ```

2. This will create the `dist` directory with all necessary files

## Option 1: Deploying on Render

Render offers a straightforward deployment experience:

1. Create an account at [render.com](https://render.com)
2. Create a new Web Service
3. Configure settings:
   - Name: ChickFarms
   - Runtime: Node
   - Build Command: `node build.js`
   - Start Command: `node server.js`

4. Set environment variables:
   - NODE_ENV: production
   - SESSION_SECRET: (generate a random string)
   - DATABASE_URL: (from your Render PostgreSQL database)
   - NOWPAYMENTS_API_KEY: (your payment API key)
   - NOWPAYMENTS_IPN_SECRET_KEY: (your webhook secret)

5. Create a PostgreSQL database in Render and connect it to your web service

## Option 2: Deploying on Vercel

1. Create an account at [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure settings:
   - Build Command: `node build.js`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. Set environment variables (in project settings):
   - NODE_ENV: production
   - SESSION_SECRET: (generate a random string)
   - DATABASE_URL: (from Neon, Supabase, or another PostgreSQL provider)
   - NOWPAYMENTS_API_KEY: (your payment API key)
   - NOWPAYMENTS_IPN_SECRET_KEY: (your webhook secret)

5. Use an external PostgreSQL provider like Neon (neon.tech) or Supabase

## Option 3: Manual Deployment

For other hosting options:

1. Build your application: `node build.js`
2. Upload your project files to your server (excluding node_modules)
3. Install dependencies: `npm install`
4. Set environment variables
5. Connect to a PostgreSQL database
6. Start the server: `node server.js`

## Database Initialization

Regardless of hosting platform, initialize your database:

1. Make sure your DATABASE_URL is set correctly
2. Run database migrations: `npx drizzle-kit push`

## Troubleshooting

If you encounter deployment issues:

1. Check server logs for error messages
2. Verify all environment variables are set correctly
3. Ensure your database connection string is valid
4. Check that static files are being served from the `dist/public` directory
5. For module not found errors, verify your dependencies are installed correctly