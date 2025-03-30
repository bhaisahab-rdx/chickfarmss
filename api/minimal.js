// Minimal API handler for Vercel troubleshooting
// IMPORTANT: This endpoint doesn't use any database connections or external dependencies
module.exports = (req, res) => {
  try {
    // Capture basic request information
    const requestInfo = {
      method: req.method,
      path: req.path || req.url,
      headers: {
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
      },
      query: req.query || {},
    };
    
    // Capture basic environment information
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV || 'unknown',
      vercel: process.env.VERCEL === '1' ? true : false,
      region: process.env.VERCEL_REGION || 'unknown',
      timestamp: new Date().toISOString(),
      hasDbUrl: !!process.env.DATABASE_URL, // Only check if exists, don't include value
      hasApiKeys: {
        nowPayments: !!process.env.NOWPAYMENTS_API_KEY,
        sessionSecret: !!process.env.SESSION_SECRET,
      }
    };
    
    // Successful response with NO database dependencies
    res.status(200).json({
      status: 'success',
      message: 'Minimal API endpoint is working correctly, with NO database connections',
      requestInfo,
      environmentInfo,
      serverInfo: {
        memory: process.memoryUsage().rss / 1024 / 1024, // MB
        uptime: process.uptime(),
        nodeVersion: process.version,
      }
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error('Minimal API error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal error in minimal API',
      error: error.message,
    });
  }
};