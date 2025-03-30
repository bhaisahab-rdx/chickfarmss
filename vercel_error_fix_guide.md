# ChickFarms Vercel Deployment Error Troubleshooting Guide

This guide addresses common errors encountered when deploying the ChickFarms application to Vercel and provides step-by-step solutions.

## Common Error: "Build src is client/index.html but expected package.json"

### Problem
Vercel is looking for a package.json in the client directory instead of using the root package.json file.

### Solution
1. Update `vercel.json` to explicitly specify the build command and output directory:
   ```json
   {
     "version": 2,
     "buildCommand": "./vercel-build.sh",
     "outputDirectory": "dist",
     "routes": [
       { "src": "/api/(.*)", "dest": "/api/index.js" },
       { "handle": "filesystem" },
       { "src": "/(.*)", "dest": "/index.html" }
     ]
   }
   ```

2. Make sure `vercel-build.sh` is executable:
   ```bash
   chmod +x vercel-build.sh
   ```

3. Verify that `vercel-build.sh` builds both the frontend and API correctly.

## Common Error: "404: NOT_FOUND" for API Routes

### Problem
After deployment, API routes return 404 errors even though the frontend loads correctly.

### Solution
1. Check the API serverless function structure:
   - Make sure `/api/index.js` exists and is correctly built
   - Verify that the API routes are properly registered in your Express app

2. Update the routing configuration in `vercel.json`:
   ```json
   "routes": [
     { "src": "/api/(.*)", "dest": "/api/index.js" },
     { "handle": "filesystem" },
     { "src": "/(.*)", "dest": "/index.html" }
   ]
   ```

3. Ensure your API handler uses serverless-http correctly:
   ```javascript
   import serverless from 'serverless-http';
   import app from '../server/index.js';

   const handler = serverless(app);
   export default async function (req, res) {
     return await handler(req, res);
   }
   ```

## Common Error: "ENOENT: no such file or directory, open '/var/task/dist/api/index.js'"

### Problem
The API serverless function file is not found in the expected location.

### Solution
1. Verify that your build script (`vercel-build.sh`) is correctly building the API:
   ```bash
   # In vercel-build.sh
   # Build the API
   esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/api
   ```

2. Check the directory structure in your build output:
   ```
   dist/
   ├── index.html
   ├── assets/
   └── api/
       └── index.js
   ```

3. Run the test script to verify the build configuration:
   ```bash
   node test-vercel-build.cjs
   ```

## Common Error: "Cannot find module 'serverless-http'"

### Problem
The serverless-http package is not found in the deployed environment.

### Solution
1. Add serverless-http to your dependencies:
   ```bash
   npm install serverless-http
   ```

2. Make sure your build process includes all dependencies:
   ```
   esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist/api
   ```

3. If you're still encountering issues, explicitly include serverless-http in your API handler using a relative path:
   ```javascript
   import serverlessHttp from '../node_modules/serverless-http/index.js';
   ```

## Common Error: "Connect ECONNREFUSED - PostgreSQL Database"

### Problem
The application cannot connect to the PostgreSQL database.

### Solution
1. Verify your DATABASE_URL environment variable in Vercel:
   - Make sure it's correctly formatted: `postgresql://username:password@hostname:port/database`
   - Check that there are no special characters that need URL encoding

2. Ensure your database is publicly accessible or that Vercel's IP ranges are allowed.

3. Test your database connection locally with the same connection string:
   ```bash
   psql "your_connection_string"
   ```

## Common Error: "CORS Error - No 'Access-Control-Allow-Origin' header"

### Problem
The browser blocks API requests due to CORS policy.

### Solution
1. Update your CORS configuration to include the Vercel URL:
   ```javascript
   app.use(cors({
     origin: process.env.VERCEL_URL ? 
       [`https://${process.env.VERCEL_URL}`, 'https://your-custom-domain.com'] : 
       'http://localhost:3000',
     credentials: true
   }));
   ```

2. Verify that the `VERCEL_URL` environment variable is available to your application.

3. If using a custom domain, add it to the allowed origins.

## Common Error: "NOWPayments IPN Not Working"

### Problem
NOWPayments Instant Payment Notifications aren't being received by your application.

### Solution
1. Update your IPN URL in the NOWPayments dashboard to match your Vercel URL:
   - Use `https://your-vercel-url.vercel.app/api/payments/ipn`

2. Ensure your API route is correctly handling the IPN callbacks:
   ```javascript
   app.post('/api/payments/ipn', express.raw({ type: 'application/json' }), async (req, res) => {
     // IPN handling logic
   });
   ```

3. Check your server logs for any errors related to IPN processing.

## Testing Your Deployment

After fixing deployment issues, test the following:

1. User registration and login functionality
2. API routes for game features
3. Payment processing with NOWPayments
4. Admin panel access and functionality

If you continue to experience issues after trying these solutions, check your Vercel deployment logs for specific error messages, or contact support for further assistance.