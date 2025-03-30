/**
 * Test script to verify the Vercel build configuration locally
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Vercel Build Test: Starting validation...');

// Check if vercel.json exists with proper configuration
if (!fs.existsSync('./vercel.json')) {
  console.error('ERROR: vercel.json file is missing!');
  process.exit(1);
}

const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));
if (!vercelConfig.builds || !vercelConfig.builds.some(build => build.src === 'vercel-build.sh')) {
  console.error('ERROR: vercel.json does not have proper builds configuration!');
  process.exit(1);
}

// Check if build script exists and is executable
if (!fs.existsSync('./vercel-build.sh')) {
  console.error('ERROR: vercel-build.sh file is missing!');
  process.exit(1);
}

try {
  // Check if build script is executable
  fs.accessSync('./vercel-build.sh', fs.constants.X_OK);
} catch (error) {
  console.error('ERROR: vercel-build.sh is not executable! Run: chmod +x vercel-build.sh');
  process.exit(1);
}

// Check if build-vercel.js exists
if (!fs.existsSync('./build-vercel.js')) {
  console.error('ERROR: build-vercel.js file is missing!');
  process.exit(1);
}

// Check for environment configuration
if (!fs.existsSync('./.env.production')) {
  console.warn('WARNING: .env.production file is missing! Make sure to set up environment variables in Vercel.');
}

console.log('Vercel Build Test: All checks passed!');
console.log('Your project is ready to be deployed to Vercel.');
console.log('Remember to:');
console.log('1. Set all required environment variables in Vercel dashboard');
console.log('2. Use the build command: ./vercel-build.sh');
console.log('3. Set the output directory to: dist');

console.log('\nEnvironment variables you need to set in Vercel:');
console.log('- DATABASE_URL');
console.log('- SESSION_SECRET');
console.log('- NODE_ENV=production');
console.log('- NOWPAYMENTS_API_KEY');
console.log('- NOWPAYMENTS_IPN_SECRET_KEY');
console.log('- VERCEL_URL will be automatically set by Vercel');