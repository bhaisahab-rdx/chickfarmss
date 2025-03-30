// Simple root API handler for Vercel deployment
module.exports = (req, res) => {
  try {
    // Send response with basic API information
    res.status(200).json({
      status: 'API is running',
      time: new Date().toISOString(),
      message: 'ChickFarms API v1.0',
      endpoints: [
        '/api/health',
        '/api/test'
      ]
    });
  } catch (error) {
    console.error('Error in API root:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: error.message
    });
  }
};