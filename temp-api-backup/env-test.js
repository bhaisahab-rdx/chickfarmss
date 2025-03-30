/**
 * Environment variable test endpoint for Vercel deployment
 */

/**
 * Handler for environment test endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default function handler(req, res) {
  try {
    const envVars = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'is set (hidden)' : 'not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'is set (hidden)' : 'not set',
      NOWPAYMENTS_API_KEY: process.env.NOWPAYMENTS_API_KEY ? 'is set (hidden)' : 'not set',
      NOWPAYMENTS_IPN_SECRET_KEY: process.env.NOWPAYMENTS_IPN_SECRET_KEY ? 'is set (hidden)' : 'not set'
    };

    // Add the route to vercel.json
    const vercelRoutes = { 
      routeAdded: "Add this to vercel.json routes: { \"src\": \"/api/env-test\", \"dest\": \"/api/env-test.js\" }"
    };

    res.status(200).json({ 
      message: 'Environment Variable Test',
      environment: envVars,
      vercelRoutes
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Environment test failed',
      error: error.message 
    });
  }
}