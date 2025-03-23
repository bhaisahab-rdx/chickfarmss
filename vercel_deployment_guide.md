# Complete Vercel Deployment Guide for ChickFarms

This guide will walk you through the complete process of deploying ChickFarms to Vercel, including database setup with Supabase and NOWPayments integration.

## Prerequisites

Before you start, make sure you have:

1. Your ChickFarms repository on GitHub
2. A [Vercel](https://vercel.com) account
3. A [Supabase](https://supabase.com) account
4. A [NOWPayments](https://nowpayments.io) account

## Step 1: Set Up Your Database on Supabase

Follow the steps in the `supabase_setup_guide.md` to:
1. Create a new Supabase project
2. Execute the database setup script
3. Get your DATABASE_URL connection string

## Step 2: Configure NOWPayments API

Follow the steps in the `nowpayments_setup_guide.md` to:
1. Create a NOWPayments account
2. Generate an API key
3. Configure accepted currencies

## Step 3: Prepare Your Code for Vercel

Make sure your repository has these files for Vercel deployment:
1. `vercel.json` - Configures build settings and routes
2. `vercel-build.sh` - Build script for Vercel
3. `server/config.ts` - Configuration file for environment variables

## Step 4: Deploy to Vercel

1. **Import Your GitHub Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Select your GitHub repository

2. **Configure Project Settings**
   - Project Name: Choose a name for your project
   - Framework Preset: Leave as "Other"
   - Root Directory: Leave as default (/)
   - Build Command: `sh vercel-build.sh`
   - Output Directory: `dist`

3. **Add Environment Variables**
   - Click "Environment Variables" section
   - Add the following variables:
     ```
     DATABASE_URL: [Your Supabase Connection String]
     NOWPAYMENTS_API_KEY: [Your NOWPayments API Key]
     NODE_ENV: production
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for the deployment to complete

## Step 5: Post-Deployment Configuration

After the first deployment:

1. **Update API_URL Environment Variable**
   - Get your Vercel deployment URL (e.g., `https://chickfarms.vercel.app`)
   - Go to your project settings > Environment Variables
   - Add a new variable:
     ```
     API_URL: [Your Vercel Deployment URL]
     ```
   - Save and trigger a new deployment

2. **Configure NOWPayments IPN Callback**
   - Go to NOWPayments dashboard > Store Settings > IPN
   - Set the IPN callback URL:
     ```
     [Your Vercel URL]/api/payments/callback
     ```
   - Save settings

## Step 6: Verify Deployment

1. **Check Your Application**
   - Visit your Vercel URL
   - Verify that you can sign up and log in
   - Make sure the UI loads correctly

2. **Test Database Connection**
   - Verify that user data is saved correctly
   - Check that the admin account works

3. **Test NOWPayments Integration**
   - Make a small test deposit
   - Verify that the payment flow works

## Step 7: Domain and Production Settings

For a production deployment:

1. **Custom Domain**
   - Go to Vercel project settings > Domains
   - Add your custom domain
   - Follow Vercel's instructions to configure DNS

2. **Security**
   - Change the admin password from the default
   - Enable 2FA on your Vercel, Supabase, and NOWPayments accounts

3. **Analytics and Monitoring**
   - Set up Vercel Analytics
   - Consider adding error tracking (like Sentry)

## Troubleshooting

If you encounter issues with your deployment:

1. **Build Errors**
   - Check the build logs in Vercel
   - Verify your dependencies and build script

2. **Database Connection Issues**
   - Ensure DATABASE_URL is correct
   - Check if the database is accessible from Vercel's servers

3. **API Errors**
   - Check function logs in Vercel
   - Verify environment variables are correctly set

4. **Payment Integration Issues**
   - Follow the troubleshooting steps in the NOWPayments guide
   - Check that your API key has the correct permissions

## Ongoing Maintenance

1. **Scaling**
   - Monitor database usage and upgrade Supabase plan as needed
   - Consider upgrading to Vercel Pro for better performance

2. **Updates**
   - Keep your libraries and dependencies updated
   - Test updates in a staging environment before deploying to production

3. **Backups**
   - Set up regular database backups
   - Consider exporting data periodically

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [NOWPayments Documentation](https://nowpayments.io/help)