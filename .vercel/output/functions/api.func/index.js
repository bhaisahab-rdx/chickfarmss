/**
 * Consolidated API endpoint for Vercel deployment
 * This combines multiple API functions into a single serverless function
 * to stay within the 12-function limit of the Vercel Hobby plan
 * 
 * @note This file is intentionally using CommonJS format (not ESM)
 * because Vercel serverless functions typically use CommonJS.
 */

// Import required packages
const { Pool } = require('pg');
const crypto = require('crypto');
const fetch = require('node-fetch');

// Initialize the PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Main handler for all API requests
 */
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  
  // Debug logging for Vercel environment
  console.log(`[Vercel API] Request received: ${req.method} ${req.url}`);
  console.log(`[Vercel API] Headers: ${JSON.stringify(req.headers)}`);
  
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Get the pathname from the URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  try {
    // Route requests based on pathname
    if (pathname === '/api/health') {
      return handleHealth(req, res);
    } else if (pathname === '/api/minimal') {
      return handleMinimal(req, res);
    } else if (pathname === '/api/diagnostics') {
      return handleDiagnostics(req, res);
    } else if (pathname === '/api/env-test') {
      return handleEnvTest(req, res);
    } else if (pathname === '/api/db-test') {
      return await handleDbTest(req, res);
    } else if (pathname === '/api/test-deployment') {
      return await handleTestDeployment(req, res);
    } else if (pathname === '/api/debug') {
      return handleDebug(req, res);
    } else if (pathname === '/api/debug-spin') {
      return handleDebugSpin(req, res);
    } else if (pathname === '/api') {
      return handleIndex(req, res);
    } else if (pathname.startsWith('/api/auth/')) {
      return await handleAuthentication(req, res, pathname);
    } else if (pathname.startsWith('/api/pooled-test')) {
      return await handlePooledTest(req, res);
    } else if (pathname.startsWith('/api/spin/')) {
      return await handleSpin(req, res, pathname);
    } else {
      // Return 404 for unhandled routes
      res.status(404).json({ error: 'Not found', message: `Route ${pathname} not implemented in consolidated API` });
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

/**
 * Handle health requests
 */
function handleHealth(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    nodejs: process.version
  });
}

/**
 * Handle minimal API requests
 */
function handleMinimal(req, res) {
  res.status(200).json({ status: 'ok' });
}

/**
 * Handle diagnostics requests
 */
function handleDiagnostics(req, res) {
  res.status(200).json({
    status: 'ok',
    nodejs: process.version,
    environment: process.env.NODE_ENV || 'development',
    database: Boolean(process.env.DATABASE_URL),
    timestamp: new Date().toISOString(),
    headers: req.headers,
    path: req.url
  });
}

/**
 * Handle environment test requests
 */
function handleEnvTest(req, res) {
  res.status(200).json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'not set',
      NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY ? 'set' : 'not set',
      NOWPAYMENTS_IPN_SECRET_KEY: process.env.NOWPAYMENTS_IPN_SECRET_KEY ? 'set' : 'not set'
    }
  });
}

/**
 * Handle database test requests
 */
async function handleDbTest(req, res) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    const dbTime = result.rows[0].time;
    client.release();

    res.status(200).json({
      status: 'ok',
      connected: true,
      time: dbTime,
      message: 'Successfully connected to database'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      connected: false,
      message: `Failed to connect to database: ${error.message}`
    });
  }
}

/**
 * Handle comprehensive test requests
 */
async function handleTestDeployment(req, res) {
  const tests = {
    environment: {
      status: 'ok',
      details: {
        NODE_ENV: process.env.NODE_ENV || 'not set',
        DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set'
      }
    },
    database: {
      status: 'pending',
      details: {}
    },
    apis: {
      status: 'ok',
      details: {
        health: `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/health`,
        auth: `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/api/auth/login`
      }
    },
    security: {
      status: 'ok',
      details: {
        SESSION_SECRET: process.env.SESSION_SECRET ? 'set' : 'not set',
        NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY ? 'set' : 'not set'
      }
    }
  };

  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    const dbTime = result.rows[0].time;
    client.release();

    tests.database.status = 'ok';
    tests.database.details = {
      connected: true,
      time: dbTime,
      message: 'Successfully connected to database'
    };
  } catch (error) {
    console.error('Database connection error:', error);
    tests.database.status = 'error';
    tests.database.details = {
      connected: false,
      message: `Failed to connect to database: ${error.message}`
    };
  }

  // Calculate overall status
  const overallStatus = Object.values(tests).every(t => t.status === 'ok') ? 'ok' : 'error';

  res.status(200).json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    tests
  });
}

/**
 * Handle debug requests
 */
function handleDebug(req, res) {
  res.status(200).json({
    headers: req.headers,
    url: req.url,
    method: req.method,
    env: {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? '(set but hidden)' : 'not set'
    }
  });
}

/**
 * Special debug endpoint to diagnose spin functionality
 */
async function handleDebugSpin(req, res) {
  console.log('[DEBUG-SPIN] Debug endpoint called');
  
  // Parse the URL to show how routing works
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Create test paths for testing
  const testPaths = [
    '/api/spin/status',
    '/api/spin/spin',
    '/api/spin/claim-extra'
  ];
  
  // Test each path with our startsWith condition
  const pathTests = testPaths.map(testPath => ({
    path: testPath,
    matchesSpinPattern: testPath.startsWith('/api/spin/'),
    extractedAction: testPath.replace('/api/spin/', '')
  }));
  
  // Test regex patterns that might be used in routing
  const regexTests = [
    { pattern: '/api/spin/(.*)', match: '/api/spin/status'.match(new RegExp('/api/spin/(.*)')) !== null },
    { pattern: '^/api/spin/(.*)$', match: '/api/spin/status'.match(new RegExp('^/api/spin/(.*)$')) !== null },
    { pattern: '/api/spin/*', match: '/api/spin/status'.match(new RegExp('/api/spin/*')) !== null }
  ];
  
  // Extract cookies for debug info
  const cookies = parseCookies(req.headers.cookie || '');
  
  // Verify token if present
  let tokenStatus = 'No token provided';
  if (cookies.session) {
    try {
      const userId = validateSessionToken(cookies.session);
      tokenStatus = userId ? `Valid (User ID: ${userId})` : 'Invalid token';
    } catch (error) {
      tokenStatus = `Error validating token: ${error.message}`;
    }
  }
  
  // Check if we can connect to the database
  let databaseStatus = 'Not checked';
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    const dbTime = result.rows[0].time;
    client.release();
    databaseStatus = `Connected successfully (DB time: ${dbTime})`;
  } catch (error) {
    databaseStatus = `Connection error: ${error.message}`;
  }
  
  // Get the deployment URL for testing routes
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  const baseUrl = `${protocol}://${host}`;
  
  // Response with comprehensive debug info
  res.status(200).json({
    status: 'debug',
    message: 'Spin endpoint debugging information',
    request: {
      url: req.url,
      pathname,
      method: req.method,
      headers: req.headers,
      cookies
    },
    routing: {
      pathTests,
      regexTests,
      requestWouldMatchSpinPattern: pathname.startsWith('/api/spin/'),
      spinApiEndpoints: testPaths.map(path => `${baseUrl}${path}`),
      vercelConfig: {
        routesChecks: [
          { description: "Spin routes should come before general API route", checkManually: true },
          { description: "Debug endpoint should be explicitly configured", checkManually: true }
        ]
      }
    },
    authentication: {
      cookiePresent: Boolean(cookies.session),
      cookieValue: cookies.session ? `${cookies.session.substring(0, 10)}...` : null,
      tokenStatus
    },
    environment: {
      databaseStatus,
      databaseUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
      sessionSecret: process.env.SESSION_SECRET ? 'Set (hidden)' : 'Not set',
      nodeEnv: process.env.NODE_ENV || 'Not set'
    },
    troubleshooting: {
      verifyAuthentication: `First log in at ${baseUrl}/login, then check if the spin endpoints work`,
      checkFunctionLogs: "If endpoints still return 404, check Vercel function logs for routing issues",
      potentialFixes: [
        "Ensure routes in .vercel/output/config.json have '/api/spin/(.*)' before '/api/(.*)'",
        "Verify SESSION_SECRET is correctly set in environment variables",
        "Try removing and re-adding the spin route pattern in .vercel/output/config.json"
      ]
    }
  });
}

/**
 * Handle index requests
 */
function handleIndex(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'ChickFarms API is running',
    timestamp: new Date().toISOString(),
    routes: [
      '/api/health',
      '/api/minimal',
      '/api/diagnostics',
      '/api/env-test',
      '/api/db-test',
      '/api/test-deployment',
      '/api/debug',
      '/api/debug-spin',
      '/api/auth/login',
      '/api/auth/register',
      '/api/auth/logout',
      '/api/auth/user',
      '/api/spin/status',
      '/api/spin/spin',
      '/api/spin/claim-extra'
    ]
  });
}

/**
 * Handle authentication-related requests (login, register, logout, user info)
 */
async function handleAuthentication(req, res, pathname) {
  // Extract the auth action from the pathname
  const authAction = pathname.replace('/api/auth/', '');

  if (authAction === 'login') {
    return await handleLogin(req, res);
  } else if (authAction === 'register') {
    return await handleRegister(req, res);
  } else if (authAction === 'logout') {
    return handleLogout(req, res);
  } else if (authAction === 'user') {
    return await handleGetUser(req, res);
  } else {
    res.status(404).json({ error: 'Not found', message: `Auth route ${authAction} not implemented` });
  }
}

/**
 * Handle login requests
 */
async function handleLogin(req, res) {
  try {
    // Get username and password from request body
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Bad request', message: 'Username and password are required' });
    }

    // Query the database for the user
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password' });
    }

    const user = result.rows[0];
    
    // Verify the password
    const passwordValid = await verifyPassword(password, user.password);
    
    if (!passwordValid) {
      client.release();
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid username or password' });
    }

    // Update last login time
    await client.query('UPDATE users SET "lastLoginAt" = NOW() WHERE id = $1', [user.id]);
    client.release();

    // Generate a session token
    const token = generateSessionToken(user.id);

    // Set the session cookie
    res.setHeader('Set-Cookie', `session=${token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);

    // Return user data (excluding password)
    const { password: _, ...userData } = user;
    
    res.status(200).json({
      status: 'ok',
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle register requests
 */
async function handleRegister(req, res) {
  try {
    // Get username, password, and referral code from request body
    const { username, password, referralCode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Bad request', message: 'Username and password are required' });
    }

    // Check if username already exists
    const client = await pool.connect();
    const existingUser = await client.query('SELECT * FROM users WHERE username = $1', [username]);
    
    if (existingUser.rows.length > 0) {
      client.release();
      return res.status(409).json({ error: 'Conflict', message: 'Username already exists' });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    // Generate a unique referral code for the new user
    const newUserReferralCode = generateReferralCode(username);

    // Find referrer user ID if referral code was provided
    let referredBy = null;
    if (referralCode) {
      const referrerResult = await client.query('SELECT id FROM users WHERE "referralCode" = $1', [referralCode]);
      if (referrerResult.rows.length > 0) {
        referredBy = referrerResult.rows[0].id;
      }
    }

    // Insert the new user
    const insertResult = await client.query(
      'INSERT INTO users (username, password, "referralCode", "referredBy") VALUES ($1, $2, $3, $4) RETURNING *',
      [username, hashedPassword, newUserReferralCode, referredBy]
    );

    // If user was referred, increment the referrer's referral count
    if (referredBy) {
      await client.query('UPDATE users SET "referralCount" = "referralCount" + 1 WHERE id = $1', [referredBy]);
    }

    client.release();

    // Extract the new user data (excluding password)
    const { password: _, ...userData } = insertResult.rows[0];

    // Generate a session token
    const token = generateSessionToken(userData.id);

    // Set the session cookie
    res.setHeader('Set-Cookie', `session=${token}; Path=/; HttpOnly; Max-Age=2592000; SameSite=Lax`);

    res.status(201).json({
      status: 'ok',
      message: 'Registration successful',
      user: userData
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle logout requests
 */
function handleLogout(req, res) {
  // Clear the session cookie
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax');
  
  res.status(200).json({
    status: 'ok',
    message: 'Logout successful'
  });
}

/**
 * Handle get user requests
 */
async function handleGetUser(req, res) {
  try {
    // Get the session token from cookies
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.session;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No session token provided' });
    }

    // Validate the token and get user ID
    const userId = validateSessionToken(token);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid session token' });
    }

    // Query the database for the user
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }

    // Return user data (excluding password)
    const { password: _, ...userData } = result.rows[0];
    
    res.status(200).json({
      status: 'ok',
      user: userData
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Helper function to hash a password
 * @param {string} password - The plain text password to hash
 * @returns {Promise<string>} The hashed password
 */
async function hashPassword(password) {
  // Generate a random salt
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Hash the password with the salt
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  
  // Return the hash and salt combined
  return `${hash}.${salt}`;
}

/**
 * Helper function to verify a password against a hash
 * @param {string} password - The plain text password to verify
 * @param {string} storedHash - The hash to verify against
 * @returns {Promise<boolean>} True if the password matches, false otherwise
 */
async function verifyPassword(password, storedHash) {
  // Split the stored hash into hash and salt
  const [hash, salt] = storedHash.split('.');
  
  // Hash the provided password with the stored salt
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  
  // Return true if the hashes match
  return hash === verifyHash;
}

/**
 * Helper function to generate a session token
 * @param {number} userId - The user ID to include in the token
 * @returns {string} The generated session token
 */
function generateSessionToken(userId) {
  // Create a payload with the user ID and an expiration time
  const payload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30 days expiration
  };
  
  // Convert the payload to a string
  const payloadStr = JSON.stringify(payload);
  
  // Encode the payload as base64
  const encodedPayload = Buffer.from(payloadStr).toString('base64');
  
  // Create a signature using HMAC-SHA256
  const signature = crypto
    .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
    .update(encodedPayload)
    .digest('base64');
  
  // Return the token as payload.signature
  return `${encodedPayload}.${signature}`;
}

/**
 * Helper function to validate a session token
 * @param {string} token - The session token to validate
 * @returns {number|null} The user ID if valid, null otherwise
 */
function validateSessionToken(token) {
  try {
    // Split the token into payload and signature
    const [encodedPayload, signature] = token.split('.');
    
    // Verify the signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SESSION_SECRET || 'default-secret')
      .update(encodedPayload)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // Decode the payload
    const payloadStr = Buffer.from(encodedPayload, 'base64').toString();
    const payload = JSON.parse(payloadStr);
    
    // Check if the token has expired
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    
    // Return the user ID
    return payload.userId;
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Helper function to parse cookies from the cookie header
 * @param {string} cookieHeader - The cookie header string
 * @returns {Object} The parsed cookies as key-value pairs
 */
function parseCookies(cookieHeader) {
  const cookies = {};
  
  if (!cookieHeader) {
    return cookies;
  }
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
  });
  
  return cookies;
}

/**
 * Helper function to generate a referral code
 * @param {string} username - The username to base the referral code on
 * @returns {string} The generated referral code
 */
function generateReferralCode(username) {
  // Create a base from the first 4 characters of the username (uppercase)
  const base = username.slice(0, 4).toUpperCase();
  
  // Generate a random 4-digit number
  const random = Math.floor(1000 + Math.random() * 9000);
  
  // Combine them
  return `${base}${random}`;
}

/**
 * Handle spin-related requests
 */
async function handleSpin(req, res, pathname) {
  try {
    // Extract the spin action from the pathname
    const spinAction = pathname.replace('/api/spin/', '');
    
    console.log(`[Vercel Spin API] Processing spin request: ${spinAction}, path: ${pathname}, method: ${req.method}`);
    console.log(`[Vercel Spin API] Cookies: ${req.headers.cookie || 'none'}`);
    

    // Get session token from cookies
    const cookies = parseCookies(req.headers.cookie || '');
    const token = cookies.session;
    
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No session token provided' });
    }
    
    // Validate token and get user ID
    const userId = validateSessionToken(token);
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid session token' });
    }
    
    // Handle different spin actions
    if (spinAction === 'status') {
      return await handleSpinStatus(req, res, userId);
    } else if (spinAction === 'spin') {
      return await handleSpinAction(req, res, userId);
    } else if (spinAction === 'claim-extra') {
      return await handleClaimExtraSpin(req, res, userId);
    } else {
      res.status(404).json({ error: 'Not found', message: `Spin action ${spinAction} not implemented` });
    }
  } catch (error) {
    console.error('Spin handling error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle spin status requests
 */
async function handleSpinStatus(req, res, userId) {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT "lastSpinAt", "extraSpinsAvailable" FROM users WHERE id = $1', [userId]);
    client.release();
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }
    
    const user = result.rows[0];
    const lastSpinAt = user.lastSpinAt ? new Date(user.lastSpinAt) : null;
    const now = new Date();
    
    // Check if 24 hours have passed since the last spin
    const canSpinDaily = !lastSpinAt || (now - lastSpinAt) >= 24 * 60 * 60 * 1000;
    
    // Calculate time until next spin (in milliseconds)
    let timeUntilNextSpin = 0;
    if (!canSpinDaily && lastSpinAt) {
      const nextSpinTime = new Date(lastSpinAt.getTime() + 24 * 60 * 60 * 1000);
      timeUntilNextSpin = Math.max(0, nextSpinTime - now);
    }
    
    res.status(200).json({
      canSpinDaily,
      timeUntilNextSpin,
      extraSpinsAvailable: user.extraSpinsAvailable
    });
  } catch (error) {
    console.error('Spin status error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle spin action requests
 */
async function handleSpinAction(req, res, userId) {
  try {
    const client = await pool.connect();
    
    // Get user's last spin time and extra spins
    const userResult = await client.query(
      'SELECT "lastSpinAt", "extraSpinsAvailable", "usdtBalance" FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }
    
    const user = userResult.rows[0];
    const lastSpinAt = user.lastSpinAt ? new Date(user.lastSpinAt) : null;
    const now = new Date();
    
    // Check if 24 hours have passed since the last spin or if user has extra spins
    const canSpinDaily = !lastSpinAt || (now - lastSpinAt) >= 24 * 60 * 60 * 1000;
    
    if (!canSpinDaily && user.extraSpinsAvailable === 0) {
      client.release();
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'You cannot spin yet. Wait until 24 hours have passed since your last spin.'
      });
    }
    
    // Determine what type of spin this is (daily or extra)
    const isExtraSpin = !canSpinDaily && user.extraSpinsAvailable > 0;
    
    // Generate a random reward (between 0.01 and 0.50 USDT)
    const reward = (Math.floor(Math.random() * 50) + 1) / 100;
    
    // Update user's balance and spin time
    const newBalance = (parseFloat(user.usdtBalance) + reward).toFixed(2);
    
    if (isExtraSpin) {
      // Use an extra spin
      await client.query(
        'UPDATE users SET "usdtBalance" = $1, "extraSpinsAvailable" = "extraSpinsAvailable" - 1 WHERE id = $2',
        [newBalance, userId]
      );
    } else {
      // Update last spin time for daily spin
      await client.query(
        'UPDATE users SET "usdtBalance" = $1, "lastSpinAt" = NOW() WHERE id = $2',
        [newBalance, userId]
      );
    }
    
    client.release();
    
    // Return the result
    res.status(200).json({
      success: true,
      reward,
      newBalance,
      spinType: isExtraSpin ? 'extra' : 'daily',
      extraSpinsRemaining: isExtraSpin ? user.extraSpinsAvailable - 1 : user.extraSpinsAvailable
    });
  } catch (error) {
    console.error('Spin action error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle claiming an extra spin
 */
async function handleClaimExtraSpin(req, res, userId) {
  try {
    const client = await pool.connect();
    
    // Update user's extra spins
    await client.query(
      'UPDATE users SET "extraSpinsAvailable" = "extraSpinsAvailable" + 1 WHERE id = $1 RETURNING "extraSpinsAvailable"',
      [userId]
    );
    
    client.release();
    
    // Return success
    res.status(200).json({
      success: true,
      message: 'Extra spin claimed successfully'
    });
  } catch (error) {
    console.error('Claim extra spin error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle pooled-test requests
 */
async function handlePooledTest(req, res) {
  // Run a series of tests to verify the API is working correctly in consolidated mode
  const results = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    tests: {
      environmental: {
        status: 'ok',
        database_url: Boolean(process.env.DATABASE_URL),
        session_secret: Boolean(process.env.SESSION_SECRET),
        nowpayments_keys: Boolean(process.env.NOWPAYMENTS_API_KEY && process.env.NOWPAYMENTS_IPN_SECRET_KEY)
      },
      database: {
        status: 'pending'
      },
      session: {
        status: 'ok',
        token_generation: false,
        token_validation: false
      }
    }
  };

  // Test database connection
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time');
    client.release();

    results.tests.database = {
      status: 'ok',
      connected: true,
      time: result.rows[0].time
    };
  } catch (error) {
    results.tests.database = {
      status: 'error',
      connected: false,
      error: error.message
    };
    results.status = 'error';
  }

  // Test session token generation and validation
  try {
    const token = generateSessionToken(999);
    results.tests.session.token_generation = Boolean(token);

    const userId = validateSessionToken(token);
    results.tests.session.token_validation = userId === 999;

    if (!results.tests.session.token_generation || !results.tests.session.token_validation) {
      results.tests.session.status = 'error';
      results.status = 'error';
    }
  } catch (error) {
    results.tests.session = {
      status: 'error',
      error: error.message
    };
    results.status = 'error';
  }

  res.status(200).json(results);
}