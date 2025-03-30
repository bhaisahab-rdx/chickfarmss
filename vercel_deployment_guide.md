# Vercel Deployment Guide for ChickFarms (Updated March 2025)

This comprehensive guide will walk you through deploying your ChickFarms application to Vercel for production use.

## Prerequisites

1. A GitHub account with your ChickFarms repository
2. A Vercel account (you can sign up with your GitHub account)
3. A PostgreSQL database (we recommend Supabase, see the `supabase_setup_guide.md`)
4. NOWPayments API credentials for crypto payment processing

## Deployment Steps

### Step 1: Prepare Your Repository

1. Ensure your code is committed to GitHub
2. Make sure the `build-vercel.js` script is up to date
3. Verify that `vercel.json` configuration is correctly set up

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and sign in
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Select the ChickFarms repository

### Step 3: Configure Project Settings

1. In the project settings:
   - Framework Preset: Choose "Other" to use our custom configuration
   - Build Command: `node build-vercel.js && npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Development Command: `npm run dev`

2. Under the Settings tab, make sure:
   - The Node.js version is set to 18.x or later

### Step 4: Environment Variables

Add the following environment variables in the Vercel project settings:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
SESSION_SECRET=choose_a_strong_random_string_for_encryption
NODE_ENV=production
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET_KEY=your_nowpayments_ipn_secret_key
VERCEL_URL=${VERCEL_URL}  # This is automatically provided by Vercel
```

### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build and deployment to complete (typically 1-2 minutes)
3. After deployment, Vercel will provide you with a preview URL

## Post-Deployment Configuration

### Configure Custom Domain

1. Go to your Vercel project dashboard
2. Click on "Domains"
3. Add your custom domain (e.g., chickfarms.com)
4. Follow Vercel's instructions to configure DNS settings

### Update NOWPayments IPN URL

1. Log in to your NOWPayments account
2. Update your IPN callback URL to your new domain:
   ```
   https://your-domain.com/api/ipn/nowpayments
   ```

### Set Up Monitoring

1. Enable Vercel Analytics to track user activity and performance
2. Set up error alerts in Vercel (Settings → Monitoring)

## Scale Your Deployment (As Needed)

1. If your user base grows, consider:
   - Upgrading your Supabase database plan
   - Enabling Edge Function Caching in Vercel
   - Setting up server-side caching for frequently accessed resources

## Database Management

1. Run migrations using the Vercel CLI:
   ```bash
   vercel env pull .env.production.local
   NODE_ENV=production npm run db:push
   ```

2. Or manage your database directly through Supabase dashboard

## Troubleshooting Deployment Issues

- **Build Failures**: Check Vercel build logs for detailed error messages
- **Runtime Errors**: Use Vercel Logs to identify issues
- **Database Connection Issues**: Verify IP restrictions in Supabase
- **Payment Processing Problems**: Check NOWPayments API settings and webhooks

## Backup and Recovery

1. Regularly back up your database using:
   ```bash
   node export-db-sql.js database_backup.sql
   ```
2. Store backups securely and implement a regular backup schedule

## Important Security Considerations

- Enable CORS protection
- Set up rate limiting for API endpoints
- Configure proper CSP headers
- Regularly update dependencies
- Monitor for unusual transaction patterns

Remember to replace placeholder values with your actual configuration details before deployment.