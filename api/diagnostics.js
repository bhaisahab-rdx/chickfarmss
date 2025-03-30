// Diagnostics API for debugging deployment issues
// Collects various system information and environment details

/**
 * Handler for diagnostics API endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default function handler(req, res) {
  // Get memory usage
  const memoryUsage = process.memoryUsage();
  
  // Get all environment variables
  // Filter out sensitive information
  const safeEnvVars = Object.keys(process.env)
    .filter(key => {
      const lowercaseKey = key.toLowerCase();
      return !lowercaseKey.includes('key') &&
             !lowercaseKey.includes('secret') &&
             !lowercaseKey.includes('token') &&
             !lowercaseKey.includes('password') &&
             !lowercaseKey.includes('auth') &&
             !lowercaseKey.includes('pwd');
    })
    .reduce((obj, key) => {
      // For database URLs, hide credentials
      if (key === 'DATABASE_URL' && process.env[key]) {
        const url = process.env[key];
        const sanitized = url.replace(/(postgres|postgresql):\/\/[^:]+:[^@]+@/, '$1://****:****@');
        obj[key] = sanitized;
      } else {
        obj[key] = process.env[key];
      }
      return obj;
    }, {});
  
  // Return diagnostic information
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    nodejs: {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: `${Math.floor(process.uptime())} seconds`,
      memoryUsage: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)} MB`
      },
      env: process.env.NODE_ENV || 'development'
    },
    request: {
      url: req.url,
      method: req.method,
      headers: {
        host: req.headers.host,
        'user-agent': req.headers['user-agent'],
        referer: req.headers.referer,
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-forwarded-host': req.headers['x-forwarded-host'],
        'x-forwarded-proto': req.headers['x-forwarded-proto']
      }
    },
    deployment: {
      vercel: {
        detected: !!(process.env.VERCEL || process.env.VERCEL_URL),
        url: process.env.VERCEL_URL || 'not set',
        region: process.env.VERCEL_REGION || 'not set',
        env: process.env.VERCEL_ENV || 'not set'
      },
      database: {
        configured: !!process.env.DATABASE_URL,
        url: safeEnvVars.DATABASE_URL || 'not set'
      },
      config: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: Intl.DateTimeFormat().resolvedOptions().locale
      }
    },
    environment: safeEnvVars
  });
}