#!/bin/bash

# Vercel build script for ChickFarms application
set -e

echo "Starting ChickFarms Vercel build process..."

# Set production environment
export NODE_ENV=production

# Run pre-build checks
echo "Running pre-build checks..."
if [ ! -d "api" ]; then
  echo "Error: API directory not found"
  exit 1
fi

if [ ! -d "public" ]; then
  echo "Error: Public directory not found"
  exit 1
fi

# Run build scripts
echo "Running build scripts..."
node build-vercel.js
node vercel-api-build.js

# Verify build
echo "Verifying build..."
if [ ! -f "api/health.js" ]; then
  echo "Error: API health check file not found"
  exit 1
fi

if [ ! -f "vercel.json" ]; then
  echo "Error: vercel.json not found"
  exit 1
fi

# Copy production environment variables
echo "Setting up environment..."
if [ -f ".env.production" ]; then
  cp .env.production .env
  echo "Production environment variables copied"
else
  echo "Warning: .env.production not found"
fi

# Final checks
echo "Running final checks..."
node -e "console.log('Node.js version:', process.version)"
node -e "console.log('Build environment:', process.env.NODE_ENV)"

echo "Build completed successfully"