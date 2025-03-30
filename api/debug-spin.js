/**
 * ChickFarms Spin Debug Endpoint
 * 
 * This API endpoint provides detailed diagnostic information to help troubleshoot
 * issues with spin functionality in the Vercel deployment environment.
 */

export default function handler(req, res) {
  // Basic request information
  const requestInfo = {
    method: req.method,
    url: req.url,
    path: req.path || req.url.split('?')[0],
    query: req.query,
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      'content-type': req.headers['content-type'],
      cookie: req.headers.cookie ? 'PRESENT (content redacted)' : 'MISSING',
      authorization: req.headers.authorization ? 'PRESENT (content redacted)' : 'MISSING',
      referer: req.headers.referer,
      'accept': req.headers.accept
    }
  };

  // Environment information
  const envInfo = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || false,
    VERCEL_URL: process.env.VERCEL_URL || 'not set',
    VERCEL_REGION: process.env.VERCEL_REGION || 'not set',
    VERCEL_ENV: process.env.VERCEL_ENV || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'PRESENT (content redacted)' : 'MISSING',
    SESSION_SECRET: process.env.SESSION_SECRET ? 'PRESENT (content redacted)' : 'MISSING',
    NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY ? 'PRESENT (content redacted)' : 'MISSING',
    NOWPAYMENTS_IPN_SECRET_KEY: process.env.NOWPAYMENTS_IPN_SECRET_KEY ? 'PRESENT (content redacted)' : 'MISSING'
  };
  
  // Authentication information (if available)
  const authInfo = {
    isAuthenticated: false, // Default state
    sessionPresent: req.session ? true : false,
    passportPresent: req.session && req.session.passport ? true : false,
    userInfo: 'No user information available'
  };
  
  // Update auth info if user is authenticated
  if (req.session && req.session.passport && req.session.passport.user) {
    authInfo.isAuthenticated = true;
    authInfo.userInfo = {
      userId: req.session.passport.user,
      sessionExpires: req.session.cookie?._expires?.toISOString() || 'unknown'
    };
  }

  // Route information
  const routeInfo = {
    spinRoutes: [
      { url: '/api/spin/status', description: 'Get spin status', method: 'GET' },
      { url: '/api/spin/spin', description: 'Perform a spin action', method: 'POST' },
      { url: '/api/spin/claim-extra', description: 'Claim extra spins', method: 'POST' }
    ],
    // Test if the current request is for a spin route
    matchesSpinRoute: req.url.includes('/api/spin/')
  };

  // Server timing information
  const serverInfo = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    serverTimezone: new Date().getTimezoneOffset()
  };

  // Test information for debugging
  const testInfo = {
    auth: authInfo.isAuthenticated 
      ? 'You are authenticated. You should be able to access spin endpoints.'
      : 'You are NOT authenticated. Spin endpoints will return 401 Unauthorized.',
    nextSteps: [
      'Test the spin status endpoint directly: /api/spin/status',
      'Verify response matches this debug info',
      'Check authentication state if you get 401 errors',
      'Verify route ordering in vercel.json and .vercel/output/config.json'
    ]
  };

  // Return combined diagnostic information
  res.status(200).json({
    message: 'ChickFarms Debug Information for Spin Functionality',
    request: requestInfo,
    environment: envInfo,
    authentication: authInfo,
    routes: routeInfo,
    server: serverInfo,
    test: testInfo
  });
}