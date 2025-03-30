// Minimal API handler for Vercel troubleshooting
module.exports = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Minimal API endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercel: process.env.VERCEL === '1' ? true : false,
    region: process.env.VERCEL_REGION || 'unknown',
  });
};