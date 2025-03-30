// Minimal API that doesn't require any database access
// Used for basic connectivity tests, especially in serverless environments

/**
 * Handler for minimal API endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default function handler(req, res) {
  // Return a simple JSON response with info about the environment
  res.status(200).json({
    status: 'ok',
    message: 'Minimal API is working',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    // Include info about the request
    request: {
      method: req.method,
      path: req.path,
      headers: {
        host: req.headers.host,
        referer: req.headers.referer,
        'user-agent': req.headers['user-agent']
      }
    }
  });
}