// Configuration for API endpoints in different environments
const config = {
  apiBaseUrl: import.meta.env.PROD 
    ? '/.netlify/functions/api'  // Netlify functions path in production
    : '/api',                   // Dev server path for local development
  
  // Add replit domain to ensure correct URLs in development
  appBaseUrl: import.meta.env.PROD
    ? 'https://chickfarms.com'
    : window.location.origin,
    
  // Add debug flag
  debug: !import.meta.env.PROD
}

export default config;