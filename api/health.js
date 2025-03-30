// Enhanced health check endpoint for Vercel
module.exports = (req, res) => {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      deployment: process.env.VERCEL ? 'vercel' : 'unknown',
      region: process.env.VERCEL_REGION || 'unknown'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
};