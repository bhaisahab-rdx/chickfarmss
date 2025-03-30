# ChickFarms Vercel Error Fix Guide

This guide provides solutions for common errors that may occur when deploying ChickFarms to Vercel.

## Database Connection Errors

### Error: Connection refused or timeout

**Problem**: The database server is refusing connections or timing out.

**Solutions**:
1. Ensure your database allows external connections from Vercel's IP addresses
2. Check that the database is running and accessible
3. Verify the connection string format: `postgresql://username:password@host:port/database`

If using Supabase, use port 6543 instead of 5432:
```
# Change this:
postgresql://postgres:password@db.example.supabase.co:5432/postgres

# To this:
postgresql://postgres:password@db.example.supabase.co:6543/postgres
```

### Error: SSL connection required

**Problem**: The database requires SSL connections but the connection string doesn't specify SSL.

**Solution**:
Add `?sslmode=require` to the end of your connection string:
```
postgresql://username:password@host:port/database?sslmode=require
```

## Module Import Errors

### Error: Cannot use import statement outside a module

**Problem**: Vercel's Node.js runtime is having issues with ES modules.

**Solutions**:
1. Run the pre-deployment script: `node vercel-api-build.js`
2. Make sure all local imports use the `.js` extension
3. Add `"type": "module"` to your package.json if not already present

### Error: Cannot find module './xyz'

**Problem**: The import path is missing a file extension.

**Solution**:
Ensure all local imports include the `.js` extension:
```javascript
// Change this:
import { something } from './utils'

// To this:
import { something } from './utils.js'
```

## API Function Timeouts

### Error: Function execution timed out

**Problem**: The serverless function is taking too long to execute (>10 seconds).

**Solutions**:
1. Optimize database queries
2. Ensure database connections are properly closed after use
3. Increase the function timeout in vercel.json:
```json
{
  "functions": {
    "api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

## Memory Limit Exceeded

### Error: Function memory limit exceeded

**Problem**: The function is using more memory than allowed (default is 1024MB).

**Solutions**:
1. Optimize memory usage in your code
2. Increase the memory limit in vercel.json:
```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 2048
    }
  }
}
```

## Configuration File Issues

### Error: The `functions` property cannot be used in conjunction with the `builds` property

**Problem**: Vercel doesn't allow using both `functions` and `builds` properties in vercel.json at the same time.

**Solution**:
Move your function-specific configurations into the `config` property of the corresponding build:

```json
// Change this:
{
  "builds": [
    {
      "src": "api/**/*.js",
      "use": "@vercel/node"
    }
  ],
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  }
}

// To this:
{
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
}
```

## Environment Variable Issues

### Error: Missing environment variables

**Problem**: Required environment variables are not available to the function.

**Solution**:
1. Check that all required environment variables are set in the Vercel dashboard
2. Make sure you're not referencing variables that only exist in your local development environment
3. Verify that the names match exactly (case-sensitive)

## Connection Pooling Issues

### Error: Too many database connections

**Problem**: Each serverless function creates its own database connection, causing too many connections.

**Solutions**:
1. Use a connection pooling service like PgBouncer or Supabase
2. Implement exponential backoff and retry logic (already included in our API)
3. Ensure connections are always released after use with a finally block:
```javascript
let client = null;
try {
  client = await pool.connect();
  // Use client...
} finally {
  if (client) client.release();
}
```

## Progressive Troubleshooting

If you're still having issues, follow this progressive troubleshooting approach:

1. Test static asset serving: `https://your-app.vercel.app/health.html`
2. Test minimal API without database: `https://your-app.vercel.app/api/minimal`
3. Test system information: `https://your-app.vercel.app/api/health`
4. Test database connection: `https://your-app.vercel.app/api/db-test`
5. Test diagnostics: `https://your-app.vercel.app/api/diagnostics`

Use the comprehensive test page: `https://your-app.vercel.app/vercel-test.html`

## Additional Resources

- Vercel Documentation: https://vercel.com/docs
- Postgres Connection Pooling: https://www.vercel.com/guides/postgresql-connection-pooling-with-vercel
- Supabase Connection Guide: https://supabase.com/docs/guides/database/connecting-to-postgres

If you've tried everything and are still experiencing issues, contact support or open an issue in the GitHub repository.