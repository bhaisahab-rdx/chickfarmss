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

# Create root HTML redirect if it doesn't exist
echo "Checking for root index.html file..."
if [ ! -f "index.html" ]; then
  echo "Creating root index.html redirect..."
  cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0;url=/dist/public/index.html" />
  <title>ChickFarms - Loading...</title>
  <style>
    body {
      font-family: 'Arial', sans-serif;
      background-color: #f7f9fc;
      color: #333;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      text-align: center;
    }
    .loader-container {
      padding: 20px;
      border-radius: 8px;
      background-color: white;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .loader {
      border: 5px solid #f3f3f3;
      border-top: 5px solid #f8931f;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    h1 {
      color: #f8931f;
      margin-bottom: 10px;
    }
    p {
      color: #666;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loader-container">
    <div class="loader"></div>
    <h1>ChickFarms</h1>
    <p>Loading your farming adventure...</p>
  </div>
</body>
</html>
EOF
  echo "Root index.html redirect created"
fi

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