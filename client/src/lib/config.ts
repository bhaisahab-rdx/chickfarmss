// Configuration for API endpoints in different environments
const config = {
  apiBaseUrl: import.meta.env.PROD 
    ? '/.netlify/functions/api'  // Netlify functions path in production
    : '/api',                   // Dev server path for local development
}

export default config;