# ChickFarms Vercel Deployment

This document provides an overview of the Vercel deployment setup for ChickFarms.

## Deployment Files

- `vercel.json`: Configuration for Vercel deployment
- `build-vercel.js`: Main build script for preparing the application for Vercel
- `vercel-api-build.js`: Script for preparing API routes for Vercel
- `vercel-build.sh`: Shell script for running the build process
- `.vercelignore`: Files and directories to exclude from deployment
- `.env.production`: Production environment variables
- `vercel_deployment_guide.md`: Comprehensive guide for deployment
- `vercel_error_fix_guide.md`: Guide for resolving common deployment issues

## API Structure

The API is structured as serverless functions in the `api/` directory:

- `api/app.js`: Express application setup
- `api/server.js`: Server startup and configuration
- `api/index.js`: Root API handler
- `api/health.js`: Health check endpoint
- `api/minimal.js`: Minimal endpoint that doesn't require database access
- `api/db-test.js`: Test database connection
- `api/pooled-test.js`: Test database connection pool
- `api/diagnostics.js`: System diagnostics endpoint
- `api/debug.js`: Debug information endpoint

## Deployment Process

1. Push your code to a repository (GitHub, GitLab, etc.)
2. Connect the repository to Vercel
3. Set up environment variables in the Vercel dashboard
4. Deploy the application

## Testing the Deployment

After deployment, verify that your application is working correctly:

1. Visit the main application URL
2. Check `https://your-app.vercel.app/health.html`
3. Check `https://your-app.vercel.app/api/health`
4. Check `https://your-app.vercel.app/api/minimal`
5. Check `https://your-app.vercel.app/api/diagnostics`

## Troubleshooting

If you encounter issues with your deployment, refer to `vercel_error_fix_guide.md` for solutions to common problems.

## Database Connection

The application uses a PostgreSQL database with connection pooling and retry logic. The database connection is configured using the `DATABASE_URL` environment variable.

When deploying to Vercel, make sure your database is accessible from Vercel's servers and that you've set up the correct connection string in the environment variables.

## Next Steps

- Set up automatic deployments from your repository
- Configure custom domains if needed
- Set up monitoring and alerts
- Implement CI/CD pipeline for testing before deployment