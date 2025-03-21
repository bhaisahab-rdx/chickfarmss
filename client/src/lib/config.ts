// Configuration for API endpoints in different environments
const config = {
  apiBaseUrl: process.env.NODE_ENV === 'production' 
    ? '/.netlify/functions/api'  // Netlify functions path in production
    : '/api',                   // Dev server path for local development
}

export default config;