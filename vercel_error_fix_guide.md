# Fixing the "Build src is client/index.html but expected package.json or build.sh" Error in Vercel

This guide provides step-by-step instructions for fixing the Vercel build error: 
> Error: Build "src" is "client/index.html" but expected "package.json" or "build.sh"

## Understanding the Error

This error occurs when Vercel's build system is confused about your project structure. It's looking for standard entry points (package.json or build.sh) but is finding client/index.html instead.

## Solution Steps

1. **Update vercel.json Configuration**

   We've updated the vercel.json file to explicitly tell Vercel how to handle your project:

   ```json
   {
     "version": 2,
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "/api"
       }
     ],
     "env": {
       "NODE_ENV": "production"
     }
   }
   ```

   This configuration:
   - Specifies Vite as the framework
   - Defines build and output settings
   - Sets up API route handling
   - Ensures production environment

2. **Create Build Scripts**

   We've created/updated build scripts to properly handle both frontend and backend:
   
   - `build-vercel.js`: Handles the build process for Vercel deployments
   - `vercel-build.sh`: Executable shell script for Vercel to run
   
   These scripts ensure that Vercel can properly build your full-stack application.

3. **Configure Environment Variables**

   We've created a `.env.production` file with your environment variables, and updated the server configuration to properly handle these variables in different environments (Vercel, Replit, localhost).

4. **Setting Up Vercel Project**

   When setting up your project in Vercel:
   
   1. Select "Vite" as the Framework Preset
   2. Set the environment variables (DATABASE_URL, NOWPAYMENTS_API_KEY, etc.)
   3. Keep the default build settings to use the commands defined in your package.json

## If You Still Encounter Issues

If you still see the same error after implementing these changes:

1. Go to your Vercel project settings
2. Under "Build & Development Settings":
   - Framework Preset: Vite
   - Build Command: Override with `./vercel-build.sh`
   - Output Directory: dist
   - Install Command: npm install

3. Redeploy your project

## Verifying the Fix

After a successful deployment:

1. Check your live site to ensure it loads properly
2. Test authentication - make sure users can log in
3. Test the NOWPayments integration (try a small deposit)
4. Verify that all game features (chickens, spins, etc.) are working correctly

## Additional Resources

- For more detailed deployment instructions, see `vercel_deployment_guide.md`
- For database setup, see `supabase_setup_guide.md`
- For NOWPayments integration, see `nowpayments_integration_guide.md`