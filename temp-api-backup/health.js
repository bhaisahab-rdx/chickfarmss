// Health check API for basic verification
// Used for monitoring and deployment health checks

/**
 * Handler for health API endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default function handler(req, res) {
  const memoryUsage = process.memoryUsage();
  
  // Return health status with basic system info
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
    },
    environment: {
      node: process.version,
      env: process.env.NODE_ENV || 'development',
      platform: process.platform,
      arch: process.arch
    }
  });
}