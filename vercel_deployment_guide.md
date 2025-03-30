# ChickFarms Vercel Deployment Guide

This guide will walk you through deploying the ChickFarms application to Vercel.

## Prerequisites

1. A GitHub repository containing your ChickFarms codebase
2. A Vercel account linked to your GitHub account
3. A PostgreSQL database (e.g., Supabase)
4. NOWPayments API credentials

## Environment Variables

Make sure to set the following environment variables in your Vercel project settings:

```
DATABASE_URL=postgresql://postgres:thekinghu8751@db.zgsyciaoixairqqfwvyt.supabase.co:5432/postgres
SESSION_SECRET=,Y1#!e&yGr-.%;Zb7X*W](YJ=DyE-F
NODE_ENV=production
NOWPAYMENTS_API_KEY=JW7JXM6-DHEMGBX-J58QEXM-R2ETSY3
NOWPAYMENTS_IPN_SECRET_KEY=A73NxQfXxJzHJF3Qh9jWkxbSvZHas8um
VERCEL_URL=${VERCEL_URL}
```

Note: The `VERCEL_URL` variable is automatically provided by Vercel and should be referenced as `${VERCEL_URL}`.

## Deployment Steps

1. Push your code to GitHub (if you haven't already)
2. Log in to your Vercel account
3. Click "Add New" > "Project"
4. Import your GitHub repository
5. Configure your project:
   - Framework Preset: Select "Vite" from the dropdown
   - Root Directory: Leave as default (should be "/")
   - Build Command: Use default (will use the one in package.json)
   - Output Directory: Defaults to "dist"
6. Add all the environment variables listed above
7. Click "Deploy"

## Post-Deployment Configuration

After successful deployment, you need to:

1. Update your NOWPayments IPN callback URL to point to your Vercel deployment:
   - Log in to NOWPayments dashboard
   - Go to Callbacks/IPN settings
   - Set the callback URL to: `https://your-vercel-url.vercel.app/api/nowpayments/ipn`
   - Update the `NOWPAYMENTS_IPN_SECRET_KEY` if needed

2. Verify your deployment:
   - Visit your deployed site at `https://your-vercel-url.vercel.app`
   - Make sure you can log in
   - Test the payment system by attempting a small deposit
   - Verify other functionality like chicken management, spin wheel, etc.

## Troubleshooting

If you encounter issues:

1. Check Vercel build logs for errors
2. Verify that all environment variables are correctly set
3. Make sure your database is accessible from Vercel's servers
4. If you see 500 errors, check your server logs in Vercel's dashboard
5. For payment issues, verify your NOWPayments API settings and callback URL

## Updating Your Deployment

To update your deployment, simply push changes to your GitHub repository. Vercel will automatically rebuild and deploy your application.

For major changes involving database schema updates, run migrations manually or update through Drizzle's tools before deploying the code changes.