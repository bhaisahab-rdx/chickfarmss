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
    console.error('Spin error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle spin status requests
 */
async function handleSpinStatus(req, res, userId) {
  try {
    // Get the user data
    const client = await pool.connect();
    const result = await client.query('SELECT "lastSpinAt", "extraSpinsAvailable" FROM users WHERE id = $1', [userId]);
    client.release();

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }

    const user = result.rows[0];
    const lastSpinAt = new Date(user.lastSpinAt);
    const now = new Date();
    
    // Calculate time until next spin is available (24 hours from last spin)
    const nextSpinTime = new Date(lastSpinAt);
    nextSpinTime.setHours(nextSpinTime.getHours() + 24);
    
    const timeUntilNextSpin = Math.max(0, nextSpinTime.getTime() - now.getTime());
    const canSpinDaily = timeUntilNextSpin === 0;
    
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
    // Check if user can spin
    const client = await pool.connect();
    const result = await client.query('SELECT "lastSpinAt", "extraSpinsAvailable", "usdtBalance" FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0) {
      client.release();
      return res.status(404).json({ error: 'Not found', message: 'User not found' });
    }

    const user = result.rows[0];
    const lastSpinAt = new Date(user.lastSpinAt);
    const now = new Date();
    
    // Calculate time until next spin is available (24 hours from last spin)
    const nextSpinTime = new Date(lastSpinAt);
    nextSpinTime.setHours(nextSpinTime.getHours() + 24);
    
    const timeUntilNextSpin = Math.max(0, nextSpinTime.getTime() - now.getTime());
    const canSpinDaily = timeUntilNextSpin === 0;
    
    // Check if user can spin
    if (!canSpinDaily && user.extraSpinsAvailable <= 0) {
      client.release();
      return res.status(400).json({ error: 'Bad request', message: 'No spins available' });
    }
    
    // Generate a random reward between 0.01 and 0.10 USDT
    const reward = (Math.floor(Math.random() * 10) + 1) / 100;
    
    // Update user data
    let spinType = '';
    
    if (canSpinDaily) {
      // Use the daily spin
      await client.query('UPDATE users SET "lastSpinAt" = NOW(), "usdtBalance" = "usdtBalance" + $1 WHERE id = $2', [reward, userId]);
      spinType = 'daily';
    } else {
      // Use an extra spin
      await client.query('UPDATE users SET "extraSpinsAvailable" = "extraSpinsAvailable" - 1, "usdtBalance" = "usdtBalance" + $1 WHERE id = $2', [reward, userId]);
      spinType = 'extra';
    }
    
    // Get updated user data
    const updatedResult = await client.query('SELECT "usdtBalance", "extraSpinsAvailable" FROM users WHERE id = $1', [userId]);
    client.release();
    
    res.status(200).json({
      success: true,
      spinType,
      reward,
      newBalance: updatedResult.rows[0].usdtBalance,
      extraSpinsRemaining: updatedResult.rows[0].extraSpinsAvailable
    });
  } catch (error) {
    console.error('Spin action error:', error);
    res.status(500).json({ error: 'Server error', message: error.message });
  }
}

/**
 * Handle claim extra spin requests
 */
async function handleClaimExtraSpin(req, res, userId) {
  try {
    // Add an extra spin to the user's account
    const client = await pool.connect();
    await client.query('UPDATE users SET "extraSpinsAvailable" = "extraSpinsAvailable" + 1 WHERE id = $1', [userId]);
    
    // Get updated user data
    const updatedResult = await client.query('SELECT "extraSpinsAvailable" FROM users WHERE id = $1', [userId]);
    client.release();
    
    res.status(200).json({
      success: true,
      extraSpinsAvailable: updatedResult.rows[0].extraSpinsAvailable
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