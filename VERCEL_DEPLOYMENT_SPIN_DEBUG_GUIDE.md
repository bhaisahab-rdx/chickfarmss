# Vercel Deployment: Spin Functionality Debugging Guide

This guide documents the enhancements made to debug the issue with spin endpoints not working in the Vercel deployment environment.

## Background

The spin functionality in ChickFarms includes three key endpoints:
- `/api/spin/status` - Check spin availability and time until next spin
- `/api/spin/spin` - Perform a spin to earn rewards
- `/api/spin/claim-extra` - Claim an extra spin

These endpoints are working correctly in the local development environment but return 404 errors in Vercel's deployed environment.

## Debug Enhancements

The following enhancements have been made to help diagnose and fix the issue:

### 1. Enhanced Logging

Additional logging has been added to the consolidated API endpoint to track:
- Incoming requests to all spin-related endpoints
- Request details including method, path, and headers
- Cookie information to verify authentication status
- Error details with better context

### 2. Special Debug Endpoint

A new endpoint has been added: `/api/debug-spin` which:
- Shows detailed routing information for spin-related paths
- Tests the routing patterns used to match spin endpoints
- Provides information about authentication cookies
- Checks environment variables needed for spin functionality
- Doesn't require authentication to access

### 3. Updated Route Configuration

The Vercel configuration has been updated to prioritize spin routes:
- Added a dedicated route for the debug endpoint
- Ensured spin-related routes are processed before general API routes
- Updated the API index route to include the debug endpoint in the list of available routes

## Using the Debug Endpoint

When troubleshooting in the Vercel deployment, you can access:

```
https://your-vercel-app.vercel.app/api/debug-spin
```

This will return a JSON response with detailed information about the routing configuration, request parsing, and environment status.

## Testing Authentication

To test authentication-related issues with spin endpoints:

1. Log in to the application using normal login flow
2. Verify the session cookie is being set correctly
3. Try accessing `/api/spin/status` and check the browser's network tab
4. Check the Vercel function logs for the detailed error information

## Common Issues and Solutions

1. **404 Error for Spin Endpoints**
   - Cause: Route configuration in Vercel may not be properly directing the request
   - Solution: Verify the route patterns in .vercel/output/config.json

2. **401 Unauthorized Error**
   - Cause: Session cookie is not being passed or validated correctly
   - Solution: Check cookie settings (HttpOnly, SameSite, etc.) and verify SESSION_SECRET is set

3. **500 Server Error**
   - Cause: Database connection or query issues
   - Solution: Verify DATABASE_URL is correctly set and try reconnecting to the database

## Verifying the Fix

Once changes are deployed to Vercel, you can use the following steps to verify the fix:

1. Access the `/api/debug-spin` endpoint to confirm routing is working
2. Log in to the application and verify the session token is properly set
3. Try accessing the spin feature in the UI and check the network requests
4. Review the function logs in Vercel to ensure no errors are occurring