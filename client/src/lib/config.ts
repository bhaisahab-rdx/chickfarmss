// Configuration for API endpoints in different environments
const config = {
  // Always use /api for both production and development
  apiBaseUrl: '/api',
  
  // Add replit domain to ensure correct URLs in development
  appBaseUrl: import.meta.env.PROD
    ? 'https://chickfarms.com'
    : window.location.origin,
    
  // Add debug flag
  debug: !import.meta.env.PROD
}

export default config;