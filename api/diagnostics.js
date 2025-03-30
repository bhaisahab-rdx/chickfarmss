// Diagnostics API endpoint for checking Vercel configuration
module.exports = (req, res) => {
  try {
    // Check environment
    const environment = {
      nodeEnv: process.env.NODE_ENV || 'not set',
      vercel: process.env.VERCEL === '1' ? true : false,
      region: process.env.VERCEL_REGION || 'not set',
      isProduction: process.env.NODE_ENV === 'production',
      timestamp: new Date().toISOString(),
    };

    // Check database connection string (masked for security)
    const databaseInfo = {
      hasDbUrl: !!process.env.DATABASE_URL,
      dbProvider: process.env.DATABASE_URL ? 
        (process.env.DATABASE_URL.startsWith('postgresql') ? 'PostgreSQL' : 'Unknown') : 
        'Not configured',
      // Only show first 15 chars for security
      dbUrlPrefix: process.env.DATABASE_URL ? 
        `${process.env.DATABASE_URL.substring(0, 15)}...` : 
        'Not configured',
    };

    // Check for important configuration vars
    const configInfo = {
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasNowPaymentsApiKey: !!process.env.NOWPAYMENTS_API_KEY,
      hasNowPaymentsIpnSecretKey: !!process.env.NOWPAYMENTS_IPN_SECRET_KEY,
    };

    res.status(200).json({
      status: 'success',
      message: 'Diagnostics endpoint functioning correctly',
      environment,
      databaseInfo,
      configInfo,
      headers: {
        userAgent: req.headers['user-agent'],
        host: req.headers.host,
        accept: req.headers.accept,
      },
      memoryUsage: process.memoryUsage(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Diagnostics check failed',
      error: error.message,
      stack: process.env.NODE_ENV === 'production' ? '(hidden in production)' : error.stack,
    });
  }
};