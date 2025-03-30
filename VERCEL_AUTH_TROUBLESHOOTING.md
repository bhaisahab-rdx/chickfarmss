# ChickFarms Authentication Troubleshooting Guide for Vercel

This guide focuses specifically on authentication issues when deploying the ChickFarms application to Vercel, providing step-by-step solutions to common problems.

## Common Authentication Issues

### 1. Blank Screen After Login

**Symptoms**:
- User can log in successfully but then sees a blank screen
- No error messages in UI, but errors in browser console
- 401 Unauthorized errors when fetching user data

**Solutions**:
1. Check API route configuration in `vercel.json` to ensure authentication routes are properly configured:
   ```json
   "rewrites": [
     { "source": "/api/auth/(.*)", "destination": "/api/consolidated.js" },
     { "source": "/api/user", "destination": "/api/consolidated.js" },
     { "source": "/api/login", "destination": "/api/consolidated.js" },
     { "source": "/api/register", "destination": "/api/consolidated.js" },
     { "source": "/api/logout", "destination": "/api/consolidated.js" }
   ]
   ```

2. Verify that the `handleAuthentication` function in `api/consolidated.js` is correctly handling the authentication routes.

3. Check if cookies are being properly set and transmitted:
   - Ensure that `Set-Cookie` headers are present in the response
   - Make sure cookies are not being blocked by browser settings
   - Verify that cookies are being sent with subsequent requests

4. Verify the `SESSION_SECRET` environment variable is set correctly in Vercel.

### 2. Authentication API Routes Not Found (404 Errors)

**Symptoms**:
- 404 errors when attempting to access `/api/login`, `/api/register`, etc.
- Console errors indicating the API endpoints couldn't be found

**Solutions**:
1. Check if the routes in `vercel.json` are correctly configured to point to the consolidated API handler.

2. Verify that the consolidated.js file is being deployed correctly to Vercel.

3. Test the API route configuration with a simple endpoint like `/api/health` to confirm API routing is working.

4. If routes are still not found, try adding explicit path mappings for each authentication endpoint.

### 3. Database Connection Issues for Authentication

**Symptoms**:
- Authentication appears to work but user data can't be retrieved
- Error logs showing database connection failures
- 500 errors when querying user data

**Solutions**:
1. Verify that the `DATABASE_URL` environment variable is set correctly in Vercel.

2. Check database connection by calling the `/api/db-test` endpoint.

3. Ensure that the Vercel deployment has proper network access to your PostgreSQL database:
   - The database may need to allow connections from Vercel's IP ranges
   - Check if your database requires SSL connections

4. If using connection pooling, verify that the pool configuration is suitable for serverless environments.

### 4. Session Not Persisting Across Page Refreshes

**Symptoms**:
- User is logged out after page refresh
- Need to log in again when navigating between pages
- Session cookie missing or not being read properly

**Solutions**:
1. Check the cookie configuration in the login handler:
   ```javascript
   res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Max-Age=86400`);
   ```

2. For production deployments on custom domains, you may need to adjust the cookie settings:
   ```javascript
   res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`);
   ```

3. Verify that the session validation logic is working correctly in `handleGetUser` function.

4. Confirm that the `validateSessionToken` function is properly decoding and validating tokens.

### 5. CORS Issues with Authentication

**Symptoms**:
- Authentication API calls fail with CORS errors in console
- Preflight requests failing
- Browser blocking requests to the authentication endpoints

**Solutions**:
1. Ensure that CORS headers are properly set in the API responses:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   ```

2. For authentication endpoints that use cookies, you need to use a specific origin instead of wildcard:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.vercel.app');
   res.setHeader('Access-Control-Allow-Credentials', 'true');
   ```

3. Add a handler for OPTIONS requests to properly respond to preflight requests.

## Testing Authentication

To verify that authentication is working correctly:

1. Test login with admin credentials:
   - Username: `adminraja`
   - Password: `admin8751`

2. Check if the user session persists after refresh by:
   - Logging in
   - Refreshing the page
   - Verifying you are still logged in

3. Validate API access by making an authenticated request:
   ```javascript
   fetch('/api/user', {
     credentials: 'include'
   })
   .then(response => response.json())
   .then(data => console.log('User data:', data))
   .catch(error => console.error('Error fetching user data:', error));
   ```

4. Test logout functionality:
   - Click logout
   - Verify session is terminated
   - Confirm that protected routes redirect to login page

## Advanced Debugging Tips

If standard troubleshooting doesn't resolve the issue:

1. Add detailed logging to the authentication handlers:
   ```javascript
   console.log('[Auth API] Login attempt:', username);
   console.log('[Auth API] User lookup result:', userResult.rows);
   console.log('[Auth API] Session token generated:', sessionToken);
   ```

2. Use the browser's developer tools to:
   - Monitor network requests to authentication endpoints
   - Check cookies in the Application tab
   - Watch for errors in the Console tab

3. Create a test endpoint that returns session and auth details:
   ```javascript
   app.get('/api/auth-debug', (req, res) => {
     res.json({
       cookies: req.cookies,
       headers: req.headers,
       session: req.session,
       timestamp: new Date().toISOString()
     });
   });
   ```

4. If using a serverless function for auth, check function logs in the Vercel dashboard to see detailed error information.

## Conclusion

Authentication issues can often be complex due to the interaction between frontend, API, database, and deployment platform. By systematically addressing each component using this guide, you should be able to resolve most authentication problems in your Vercel-deployed ChickFarms application.

Remember that production deployments may have different behavior than development environments, especially regarding cookies, CORS, and security policies.