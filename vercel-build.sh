#!/bin/bash
# Display Vercel build information
echo "Starting Vercel build process..."

# Create dist directory if it doesn't exist
mkdir -p dist
mkdir -p dist/api

# Run database migration if needed
echo "Running database migrations..."
npm run db:push

# Build the frontend
echo "Building frontend..."
vite build

# Build the API
echo "Building API..."
node vercel-api-build.js

# Create a Vercel serverless function entry point
echo "Creating Vercel API handler..."
cat > dist/api/index.js << 'EOL'
import { createServer } from 'http';
import { parse } from 'url';
import app from './server/index.js';

export default function handler(req, res) {
  // This will pass the request to your Express app
  return app(req, res);
}
EOL

echo "Build process completed successfully!"
# Vercel needs a successful exit code
exit 0