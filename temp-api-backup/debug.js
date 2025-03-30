// Debug API for verifying Vercel environment and configuration

/**
 * Handler for debug API endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default function handler(req, res) {
  // Return debug information
  res.status(200).json({
    message: 'API is working',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    vercel: {
      isVercel: !!(process.env.VERCEL || process.env.VERCEL_URL),
      url: process.env.VERCEL_URL || 'not set',
      region: process.env.VERCEL_REGION || 'not set',
      env: process.env.VERCEL_ENV || 'not set'
    },
    headers: {
      host: req.headers.host,
      'user-agent': req.headers['user-agent'],
      accept: req.headers.accept,
      'x-vercel-forwarded-for': req.headers['x-vercel-forwarded-for'],
      'x-forwarded-host': req.headers['x-forwarded-host'],
      'x-forwarded-proto': req.headers['x-forwarded-proto']
    }
  });
}