// Configuration for the server environment
export const config = {
  // Database configuration
  database: {
    url: process.env.DATABASE_URL || '',
  },
  
  // NOWPayments API configuration
  nowpayments: {
    apiKey: process.env.NOWPAYMENTS_API_KEY || 'dev_test_key_for_ui_testing',
    ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET || 'dev_test_secret',
  },
  
  // API and application URLs
  urls: {
    api: process.env.API_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000'),
    app: process.env.APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:5000'),
  },
  
  // Environment settings
  env: {
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV !== 'production',
  }
};