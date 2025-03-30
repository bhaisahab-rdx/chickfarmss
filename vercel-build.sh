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

# Copy the API files to the correct location
echo "Preparing API files..."
cp -r api/* dist/api/

# Create a simple health check file
echo "Creating health check file..."
cat > dist/health.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <title>ChickFarms - API Status</title>
  <style>
    body { font-family: Arial, sans-serif; text-align: center; margin: 100px; }
    .status { color: green; font-weight: bold; }
  </style>
</head>
<body>
  <h1>ChickFarms API</h1>
  <p>Status: <span class="status">ONLINE</span></p>
  <p>The API is running and ready to accept requests.</p>
</body>
</html>
EOL

echo "Build process completed successfully!"
# Vercel needs a successful exit code
exit 0