# ChickFarms Vercel Deployment Guide

This guide provides step-by-step instructions for deploying the ChickFarms application to Vercel.

## Pre-deployment Checklist

1. Ensure you have a Vercel account
2. Make sure you have access to your PostgreSQL database credentials
3. Have your NOWPayments API keys ready

## Environment Variables

Set up the following environment variables in your Vercel project:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://username:password@host:port/database` |
| `SESSION_SECRET` | Secret for session encryption | A long, random string |
| `NODE_ENV` | Environment setting | `production` |
| `NOWPAYMENTS_API_KEY` | NOWPayments API key | Your API key |
| `NOWPAYMENTS_IPN_SECRET_KEY` | NOWPayments IPN secret | Your IPN secret key |

## Deployment Steps

### Option 1: Deploy via Vercel CLI

1. Install the Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from the project directory:
   ```bash
   vercel
   ```

4. Follow the prompts to complete the deployment.

### Option 2: Deploy via GitHub Integration

1. Push your code to a GitHub repository
2. Create a new project in the Vercel dashboard
3. Connect to your GitHub repository
4. Configure the environment variables mentioned above
5. Click "Deploy"

## Post-Deployment Verification

After deployment, verify that your application is running correctly:

1. Visit your application URL (provided by Vercel)
2. Check the health endpoint: `https://your-app.vercel.app/health.html`
3. Run the Vercel tests: `https://your-app.vercel.app/vercel-test.html`

## Troubleshooting

If you encounter issues with your deployment, follow these steps:

### Database Connection Issues

1. Check your `DATABASE_URL` environment variable
2. Ensure your database allows connections from Vercel's IP addresses
3. Verify database credentials
4. Check the database logs for any connection issues

### API Not Working

1. Visit `/api/minimal` to test the API without database access
2. Visit `/api/diagnostics` to get detailed information about the environment
3. Check the logs in the Vercel dashboard

### Missing Environment Variables

1. Check that all required environment variables are set in the Vercel dashboard
2. Redeploy after setting any missing variables

## Common Issues and Solutions

### Issue: Database Connection Failures

Symptoms:
- API routes that require database access fail
- Error messages mentioning connection timeouts or refused connections

Solutions:
- Ensure your database is accessible from external networks
- If using Supabase, ensure the connection string uses the correct port (5432 or 6543)
- Add SSL configuration to the connection string if required

### Issue: Memory Limitations

Symptoms:
- 504 Gateway Timeout errors
- Functions failing with "memory limit exceeded"

Solutions:
- Optimize database queries
- Ensure connections are properly closed
- Consider upgrading to a higher Vercel plan

### Issue: ESM Module Issues

Symptoms:
- Errors about ES modules or import statements
- "Cannot use import statement outside a module"

Solutions:
- Make sure all local imports use the `.js` extension
- Run the `node vercel-api-build.js` script before deploying

### Issue: Vercel.json Configuration Conflicts

Symptoms:
- Error message: "The `functions` property cannot be used in conjunction with the `builds` property."
- Deployment fails during the build phase

Solutions:
- Remove the `functions` property and move the configuration into the `config` property of the corresponding build
- Example:
  ```json
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node",
      "config": {
        "memory": 1024,
        "maxDuration": 10
      }
    }
  ]
  ```
- See the `vercel_error_fix_guide.md` for detailed examples

## Support

If you continue experiencing issues, contact us at support@chickfarms.com or open an issue in the GitHub repository.