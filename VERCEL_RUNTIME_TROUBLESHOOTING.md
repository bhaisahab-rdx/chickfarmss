# Vercel Runtime Troubleshooting Guide

This guide addresses common runtime errors encountered during Vercel deployments, with a focus on the consolidated API approach used in this project.

## Runtime Errors

### Invalid Runtime Error

**Error Message:**
```
The following Serverless Functions contain an invalid "runtime":
```

**Solution:**
1. Ensure you're using a supported Vercel runtime. As of March 2025, use `nodejs20.x` instead of older versions like `nodejs18.x`.
2. Update the `.vc-config.json` file in your build script:
```javascript
const vcConfigJson = {
  runtime: 'nodejs20.x',
  handler: 'index.js',
  launcherType: 'Nodejs'
};
```
3. Run `node build-vercel.js` again to regenerate the Vercel output with the correct runtime.

### Node Version Mismatch

**Error Message:**
```
Error: The Edge Function "api/..." failed to be deployed because the runtime "nodejs18.x" is not supported for Edge Functions.
```

**Solution:**
1. Make sure you're using Node.js 20.x for Edge Functions.
2. If you need to use Edge Functions, update your configuration to use `nodejs20.x`.

## API Function Errors

### Function Count Limit Exceeded

**Error Message:**
```
Error: You have exceeded the maximum number of Serverless Functions (12) for the Hobby plan.
```

**Solution:**
1. Use the consolidated API approach implemented in this project.
2. Ensure your `build-vercel.js` script is creating a single serverless function.
3. Verify that all API routes are handled by this single function.

### Missing Files

**Error Message:**
```
Error: Missing required files for runtime: nodejs20.x. Please ensure your build outputs to the correct location.
```

**Solution:**
1. Make sure `build-vercel.js` is copying the API handler to the correct location.
2. Verify that `.vercel/output/functions/api.func/index.js` exists.
3. Check that `.vc-config.json` is correctly configured.

## Deployment Errors

### HTML Files Taking Precedence

**Problem:**
Static HTML game files are being served instead of the React app.

**Solution:**
1. Make sure `build-vercel.js` is skipping HTML files in the public directory.
2. Verify that routes in `.vercel/output/config.json` are correctly configured.
3. Add explicit routes to block access to HTML game files:
```json
{
  "src": "/game.html",
  "status": 404,
  "dest": "/index.html"
}
```

### Database Connection Issues

**Problem:**
API functions fail with database connection errors.

**Solution:**
1. Verify the `DATABASE_URL` environment variable is set correctly in Vercel.
2. Ensure your database allows connections from Vercel's IP ranges.
3. Check the database connection logic in your API code.
4. Consider using connection pooling for improved reliability.

## General Troubleshooting Steps

1. **Check Logs**: Always review Vercel deployment logs for specific error messages.
2. **Local Testing**: Test the build process locally first with `node build-vercel.js` followed by `node test-consolidated-api.js`.
3. **Environment Variables**: Verify all required environment variables are set correctly in Vercel.
4. **Runtime Compatibility**: Ensure your code is compatible with Node.js 20.x or the runtime you're using.
5. **API Access**: Test your API endpoints directly after deployment to verify they're working.

## Getting Help

If you're still facing issues:
1. Verify your database is accessible from external services
2. Check for any network restrictions or firewall rules
3. Reach out to Vercel support with specific error logs
4. Consider Edge Functions as an alternative deployment approach