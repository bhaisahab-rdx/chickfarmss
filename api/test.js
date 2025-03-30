// Simple test API handler without database connections
module.exports = (req, res) => {
  try {
    // Send a simple response with environment info
    res.status(200).json({
      status: 'API is working',
      time: new Date().toISOString(),
      env: process.env.NODE_ENV || 'unknown',
      version: '1.0.0',
      // Include some diagnostic info but don't expose sensitive data
      env_vars: {
        has_db_url: !!process.env.DATABASE_URL,
        has_session_secret: !!process.env.SESSION_SECRET,
        has_nowpayments_key: !!process.env.NOWPAYMENTS_API_KEY,
        has_ipn_key: !!process.env.NOWPAYMENTS_IPN_SECRET_KEY,
        runtime: process.version,
      }
    });
  } catch (error) {
    // Log the error without exposing sensitive info
    console.error('Error in test API:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};