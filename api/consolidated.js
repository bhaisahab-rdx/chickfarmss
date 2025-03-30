/**
 * Consolidated API endpoint for Vercel deployment
 * This combines multiple API functions into a single serverless function
 * to stay within the 12-function limit of the Vercel Hobby plan
 */

import { testConnection, queryWithRetry } from './db-utils.js';
import os from 'os';

/**
 * Handle health requests
 */
function handleHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'ChickFarms API is operational',
    version: '1.0.0'
  });
}

/**
 * Handle minimal API requests
 */
function handleMinimal(req, res) {
  res.status(200).json({
    message: 'ChickFarms API is operational',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}

/**
 * Handle diagnostics requests
 */
function handleDiagnostics(req, res) {
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Get all environment variables
  // Filter out sensitive information
  const safeEnvVars = Object.keys(process.env)
    .filter(key => {
      const lowercaseKey = key.toLowerCase();
      return !lowercaseKey.includes('key') &&
             !lowercaseKey.includes('secret') &&
             !lowercaseKey.includes('token') &&
             !lowercaseKey.includes('password') &&
             !lowercaseKey.includes('auth') &&
             !lowercaseKey.includes('pwd');
    })
    .reduce((obj, key) => {
      // For database URLs, hide credentials
      if (key === 'DATABASE_URL' && process.env[key]) {
        const url = process.env[key];
        const sanitized = url.replace(/(postgres|postgresql):\/\/[^:]+:[^@]+@/, '$1://****:****@');
        obj[key] = sanitized;
      } else {
        obj[key] = process.env[key];
      }
      return obj;
    }, {});

  // Create an object with required environment variables for the test
  // This ensures the vercel-test.html page can see these variables are set
  // but doesn't expose their actual values
  const requiredEnvForTest = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'is set (value hidden)' : 'not set',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'is set (value hidden)' : 'not set',
    NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY ? 'is set (value hidden)' : 'not set',
    NOWPAYMENTS_IPN_SECRET_KEY: process.env.NOWPAYMENTS_IPN_SECRET_KEY ? 'is set (value hidden)' : 'not set'
  };

  // Return diagnostic information
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: `${Math.floor(process.uptime())} seconds`,
      memoryUsage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      env: process.env.NODE_ENV || 'development'
    },
    request: {
      url: req.url,
      method: req.method,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        referer: req.headers.referer,
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'x-forwarded-proto': req.headers['x-forwarded-proto']
      }
    },
    deployment: {
      vercel: {
        detected: !!(process.env.VERCEL || process.env.VERCEL_URL),
        url: process.env.VERCEL_URL || 'not set',
        region: process.env.VERCEL_REGION || 'not set',
        env: process.env.VERCEL_ENV || 'not set'
      },
      database: {
        configured: !!process.env.DATABASE_URL,
        url: safeEnvVars.DATABASE_URL || 'not set'
      },
      config: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    },
    environment: safeEnvVars,
    // Add required env variables in a separate property for the test page
    env: requiredEnvForTest
  });
}

/**
 * Handle environment test requests
 */
function handleEnvTest(req, res) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'is set (hidden)' : 'not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'is set (hidden)' : 'not set',
      NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY ? 'is set (hidden)' : 'not set',
      NOWPAYMENTS_IPN_SECRET_KEY: process.env.NOWPAYMENTS_IPN_SECRET_KEY ? 'is set (hidden)' : 'not set'
    };

    res.status(200).json({ 
      message: 'Environment Variable Test',
      environment: envVars
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Environment test failed',
      error: error.message 
    });
  }
}

/**
 * Handle database test requests
 */
async function handleDbTest(req, res) {
  try {
    // Test database connection
    const connectionResult = await testConnection();
    
    // Test query execution
    let queryResult = null;
    let queryError = null;
    
    if (connectionResult) {
      try {
        queryResult = await queryWithRetry('SELECT NOW() as server_time');
      } catch (err) {
        queryError = err.message;
      }
    }
    
    // Return the results
    res.status(200).json({
      success: connectionResult,
      message: connectionResult ? 'Database connection successful' : 'Database connection failed',
      timestamp: new Date().toISOString(),
      query: queryResult ? {
        success: true,
        result: queryResult.rows[0],
        message: 'Query executed successfully'
      } : {
        success: false,
        error: queryError,
        message: 'Query execution failed'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Handle comprehensive test requests
 */
async function handleTestDeployment(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    deployment: 'vercel',
    success: true,
    environment: process.env.NODE_ENV || 'unknown',
    systemInfo: {
      platform: process.platform,
      nodeVersion: process.version,
      hostname: os.hostname(),
      memory: {
        totalMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMb: Math.round(os.freemem() / 1024 / 1024),
        usagePercent: Math.round((1 - os.freemem() / os.totalmem()) * 100)
      },
      cpus: os.cpus().length
    },
    tests: []
  };

  try {
    // Test 1: Basic connectivity
    results.tests.push({
      name: 'API connectivity',
      status: 'passed',
      message: 'API endpoint is accessible'
    });

    // Test 2: Environment variables
    const requiredEnvVars = ['DATABASE_URL', 'NODE_ENV'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      results.tests.push({
        name: 'Environment variables',
        status: 'passed',
        message: 'All required environment variables are present'
      });
    } else {
      results.success = false;
      results.tests.push({
        name: 'Environment variables',
        status: 'failed',
        message: `Missing environment variables: ${missingVars.join(', ')}`
      });
    }

    // Test 3: Database connectivity
    try {
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        results.tests.push({
          name: 'Database connectivity',
          status: 'passed',
          message: 'Successfully connected to the database'
        });
        
        // Test 4: Database query
        try {
          const queryResult = await queryWithRetry('SELECT NOW() as server_time');
          results.tests.push({
            name: 'Database query',
            status: 'passed',
            message: `Database query successful. Server time: ${queryResult.rows[0].server_time}`
          });
        } catch (queryError) {
          results.success = false;
          results.tests.push({
            name: 'Database query',
            status: 'failed',
            message: `Database query failed: ${queryError.message}`,
            error: queryError.stack
          });
        }
      } else {
        results.success = false;
        results.tests.push({
          name: 'Database connectivity',
          status: 'failed',
          message: 'Failed to connect to the database'
        });
      }
    } catch (dbError) {
      results.success = false;
      results.tests.push({
        name: 'Database connectivity',
        status: 'failed',
        message: `Database connection error: ${dbError.message}`,
        error: dbError.stack
      });
    }

    // Test 5: Nowpayments API key
    if (process.env.NOWPAYMENTS_API_KEY) {
      results.tests.push({
        name: 'NOWPayments configuration',
        status: 'passed',
        message: 'NOWPayments API key is configured'
      });
    } else {
      results.success = false;
      results.tests.push({
        name: 'NOWPayments configuration',
        status: 'warning',
        message: 'NOWPayments API key is not configured, payment processing will not work'
      });
    }

    // Test 6: Check Database Tables
    try {
      const tableResult = await queryWithRetry(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tables = tableResult.rows.map(row => row.table_name);
      
      // Map required tables to actual table names (in case of naming differences)
      const requiredTablesMapping = {
        'users': 'users',
        'chickens': 'chickens',
        'transactions': 'transactions',
        'referrals': ['referrals', 'referral_earnings']  // Accept either referrals or referral_earnings
      };
      
      // Check if each required entity exists in the database
      const missingTables = [];
      for (const [requiredName, actualNames] of Object.entries(requiredTablesMapping)) {
        const actualNamesArray = Array.isArray(actualNames) ? actualNames : [actualNames];
        // If none of the possible table names for this entity exist, mark it as missing
        if (!actualNamesArray.some(name => tables.includes(name))) {
          missingTables.push(requiredName);
        }
      }
      
      if (missingTables.length === 0) {
        results.tests.push({
          name: 'Database schema',
          status: 'passed',
          message: `Found ${tables.length} tables: ${tables.join(', ')}`
        });
      } else {
        results.success = false;
        results.tests.push({
          name: 'Database schema',
          status: 'failed',
          message: `Missing required tables: ${missingTables.join(', ')}`,
          details: {
            foundTables: tables,
            requiredTables: Object.keys(requiredTablesMapping)
          }
        });
      }
    } catch (tableError) {
      results.success = false;
      results.tests.push({
        name: 'Database schema',
        status: 'failed',
        message: `Failed to check database tables: ${tableError.message}`,
        error: tableError.stack
      });
    }

  } catch (error) {
    results.success = false;
    results.error = {
      message: error.message,
      stack: error.stack
    };
  }

  // Add overall summary
  results.summary = {
    total: results.tests.length,
    passed: results.tests.filter(t => t.status === 'passed').length,
    failed: results.tests.filter(t => t.status === 'failed').length,
    warnings: results.tests.filter(t => t.status === 'warning').length
  };

  // Send appropriate status code based on test results
  const statusCode = results.success ? 200 : 500;
  res.status(statusCode).json(results);
}

/**
 * Handle debug requests
 */
function handleDebug(req, res) {
  const debugInfo = {
    timestamp: new Date().toISOString(),
    request: {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query,
      body: req.body,
      ip: req.ip || req.connection.remoteAddress
    },
    env: {
      node_env: process.env.NODE_ENV || 'development',
      database_configured: !!process.env.DATABASE_URL,
      vercel: !!process.env.VERCEL
    },
    runtime: {
      platform: process.platform,
      nodeVersion: process.version,
      memory: process.memoryUsage()
    }
  };
  
  res.status(200).json(debugInfo);
}

/**
 * Handle index requests
 */
function handleIndex(req, res) {
  res.status(200).json({
    name: "ChickFarms API",
    version: "1.0.0",
    status: "operational",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    endpoints: [
      "/api/health",
      "/api/minimal",
      "/api/diagnostics",
      "/api/env-test",
      "/api/db-test",
      "/api/test-deployment",
      "/api/debug"
    ]
  });
}

/**
 * Handle pooled-test requests
 */
async function handlePooledTest(req, res) {
  try {
    // Test database connection
    const connectionResult = await testConnection();
    
    // Return results
    res.status(200).json({
      success: connectionResult,
      message: connectionResult ? 'Pooled database connection successful' : 'Pooled database connection failed',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      database: {
        configured: !!process.env.DATABASE_URL,
        pooled: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Pooled database test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Main handler for all API requests
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default async function handler(req, res) {
  // Extract the path from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  
  // Handle root path separately
  if (pathSegments.length === 1 && pathSegments[0] === 'api') {
    return handleIndex(req, res);
  }
  
  // The path after /api/
  const action = pathSegments[pathSegments.length - 1];
  
  // Route to the appropriate handler based on the action
  switch (action) {
    case 'health':
      handleHealth(req, res);
      break;
    case 'minimal':
      handleMinimal(req, res);
      break;
    case 'diagnostics':
      handleDiagnostics(req, res);
      break;
    case 'env-test':
      handleEnvTest(req, res);
      break;
    case 'db-test':
      await handleDbTest(req, res);
      break;
    case 'test-deployment':
      await handleTestDeployment(req, res);
      break;
    case 'debug':
      handleDebug(req, res);
      break;
    case 'pooled-test':
      await handlePooledTest(req, res);
      break;
    case 'index':
      handleIndex(req, res);
      break;
    default:
      // Try to guess which handler the user wanted based on the url path
      if (url.pathname.includes('health')) {
        handleHealth(req, res);
      } else if (url.pathname.includes('db') || url.pathname.includes('database')) {
        await handleDbTest(req, res);
      } else if (url.pathname.includes('env')) {
        handleEnvTest(req, res);
      } else if (url.pathname.includes('diag')) {
        handleDiagnostics(req, res);
      } else if (url.pathname.includes('test-deploy') || url.pathname.includes('deployment')) {
        await handleTestDeployment(req, res);
      } else if (url.pathname.includes('debug')) {
        handleDebug(req, res);
      } else if (url.pathname.includes('pooled')) {
        await handlePooledTest(req, res);
      } else if (url.pathname.includes('minimal')) {
        handleMinimal(req, res);
      } else {
        // Handle unknown paths
        res.status(404).json({
          error: 'Not found',
          message: `Unknown API endpoint: ${url.pathname}`,
          availableEndpoints: ['health', 'minimal', 'diagnostics', 'env-test', 'db-test', 'test-deployment', 'debug', 'pooled-test', 'index']
        });
      }
  }
}