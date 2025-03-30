# ChickFarms Vercel Deployment Final Checklist

Use this checklist to verify all necessary steps have been completed before deploying to Vercel.

## Pre-Deployment Checks

- [ ] All HTML game files in `public` directory are excluded from deployment
- [ ] Authentication logic correctly works without URL transformations
- [ ] Database connection is properly configured and tested
- [ ] All environment variables are properly set up
- [ ] All API endpoints are operational and tested

## Build Process

- [ ] Run the consolidated API build script: `node build-vercel.js`
- [ ] Verify the `.vercel/output` directory is created with:
  - [ ] `config.json` file
  - [ ] `static` directory with frontend assets
  - [ ] `functions/api.func` directory with consolidated API handler

## Testing

- [ ] Test the consolidated API with: `node test-consolidated-api.js`
- [ ] Verify the following endpoints work:
  - [ ] `/api/health` returns status "ok"
  - [ ] `/api/minimal` returns status "ok"
  - [ ] `/api/diagnostics` shows proper environment info
  - [ ] `/api` shows API index page

## Environment Variables

Ensure these environment variables are set in Vercel:

- [ ] `DATABASE_URL`: PostgreSQL connection string
- [ ] `NODE_ENV`: Set to "production"
- [ ] `SESSION_SECRET`: Secret for session encryption
- [ ] `NOWPAYMENTS_API_KEY`: API key for payment processing
- [ ] `NOWPAYMENTS_IPN_SECRET_KEY`: IPN secret key for payment notifications

## Vercel Configuration

- [ ] `vercel.json` has correct rewrites configuration:
  ```json
  {
    "rewrites": [
      { "source": "/api/(.*)", "destination": "/api" },
      { "source": "/(.*)", "destination": "/index.html" }
    ]
  }
  ```
- [ ] Build command is set to: `node build-vercel.js`
- [ ] Output directory is set to: `.vercel/output`

## Post-Deployment Checks

After deployment, verify:

- [ ] Landing page loads properly at `/landing`
- [ ] Login functionality works correctly
- [ ] User can navigate to authenticated routes after login
- [ ] API endpoints are accessible and functional
- [ ] Game features work as expected
- [ ] No HTML game version is showing instead of React app

## Notes

- The consolidated API approach allows us to stay within Vercel's 12 function limit for Hobby plans
- All API routes are handled by a single serverless function in `api/consolidated.cjs`
- If any issues arise, check Vercel logs and database connectivity first