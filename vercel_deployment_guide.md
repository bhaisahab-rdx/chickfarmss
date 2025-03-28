# ChickFarms Vercel Deployment Guide

This guide provides step-by-step instructions for deploying ChickFarms to Vercel.

## Prerequisites

1. A GitHub repository with your ChickFarms code
2. A Vercel account (sign up at [vercel.com](https://vercel.com))
3. A Supabase database (see `supabase_setup_guide.md`)
4. Your NOWPayments API credentials

## Step 1: Prepare Your Project

1. Ensure your code is in a GitHub repository
2. Make sure all files in this guide are included in your repository:
   - `vercel.json`
   - `build-vercel.js`

## Step 2: Connect to Vercel

1. Log in to your Vercel account
2. Click "Add New" > "Project"
3. Select your GitHub repository
4. Authorize Vercel to access your repository if prompted

## Step 3: Configure Project Settings

1. Project Name: `chickfarms` (or your preferred name)
2. Framework Preset: Select "Other"
3. Root Directory: Keep as default (the root of your repository)
4. Build Command: `npm run build:vercel`
5. Output Directory: `dist`

## Step 4: Set Environment Variables

Add the following environment variables:

| Name | Value |
|------|-------|
| DATABASE_URL | Your Supabase connection string |
| NOWPAYMENTS_API_KEY | Your NOWPayments API key |
| NOWPAYMENTS_EMAIL | Your NOWPayments email |
| NOWPAYMENTS_PASSWORD | Your NOWPayments password |
| IPN_SECRET_KEY | Your IPN secret key |
| NODE_ENV | production |

## Step 5: Deploy

1. Click "Deploy"
2. Wait for the deployment to complete (this may take a few minutes)

## Step 6: Verify Deployment

1. Once deployed, Vercel will provide a URL for your application
2. Visit the URL to make sure everything is working correctly
3. Test the following:
   - User registration and login
   - Game mechanics
   - Wallet recharge with cryptocurrency payments
   - Other core features

## Step 7: Set Up Custom Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Click on "Domains"
3. Add your custom domain
4. Follow Vercel's instructions to configure DNS settings

## Step 8: Set Up CI/CD (Optional)

Vercel automatically sets up continuous deployment from your GitHub repository:

1. Every push to your main branch will trigger a new deployment
2. Pull requests will create preview deployments

To disable automatic deployments:
1. Go to your project in Vercel
2. Navigate to Settings > Git
3. Under "Ignored Build Step", you can configure when to skip builds

## Troubleshooting

If you encounter issues during deployment:

1. Check Vercel deployment logs for errors
2. Verify your environment variables are set correctly
3. Make sure your Supabase database is accessible from Vercel
4. Test your NOWPayments API credentials

For database connectivity issues:
1. Ensure your Supabase IP allow list includes Vercel's IP ranges
2. Try connecting to Supabase from your local environment with the same connection string

## Rollback (If Needed)

To roll back to a previous deployment:
1. Go to your project in Vercel
2. Click on "Deployments"
3. Find the working deployment
4. Click on the three dots (⋮) and select "Promote to Production"