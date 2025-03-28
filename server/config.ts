// Configuration for the server environment
export const config = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // API and application URLs
  urls: {
    api: process.env.API_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
        (process.env.REPL_SLUG && process.env.REPL_OWNER ? 
          `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
          'http://localhost:5000')),
    app: process.env.APP_URL || 
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
        (process.env.REPL_SLUG && process.env.REPL_OWNER ? 
          `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : 
          'http://localhost:5000')),
  },
  
  // Environment settings
  env: {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
  },
  
  // Dummy nowpayments configuration (keeping for compatibility)
  nowpayments: {
    apiKey: null,
    ipnSecretKey: null
  }
};