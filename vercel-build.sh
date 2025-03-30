#!/bin/bash
# Display Vercel build information
echo "Starting Vercel build process..."

# Create dist directory if it doesn't exist
mkdir -p dist
mkdir -p dist/api

# Run database migration if needed
echo "Running database migrations..."
npm run db:push

# Run the build
echo "Building application..."
node build-vercel.js

# Vercel needs a successful exit code
exit 0