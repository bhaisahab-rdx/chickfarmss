# ChickFarms Deployment Guide for Railway

This guide will help you deploy the ChickFarms application to Railway.

## Prerequisites

1. A Railway account (Sign up at [railway.app](https://railway.app) if you don't have one)
2. The ChickFarms codebase (which you already have)

## Deployment Steps

### 1. Prepare Your Project for Deployment

The project already has the necessary configuration files for deployment:

- `railway.toml` - Railway configuration
- `build.js` - Custom build script to compile the application
- `server.js` - Production server entry point
- `Procfile` - Process definition for web servers

### 2. Build the Application

Before deploying, make sure the application builds successfully:

```bash
# Run the build script
node build.js
```

This will create all the necessary files in the `dist/` directory.

### 3. Deploy to Railway

#### Option 1: Using Railway CLI (Recommended)

1. Install the Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login to your Railway account:
   ```bash
   railway login
   ```

3. Link your project:
   ```bash
   railway link
   ```

4. Deploy your project:
   ```bash
   railway up
   ```

#### Option 2: Using Railway GitHub Integration

1. Push your code to a GitHub repository
2. Log in to Railway dashboard
3. Create a new project from GitHub
4. Select your repository
5. Railway will detect the `railway.toml` configuration and deploy automatically

### 4. Set Up Environment Variables

Make sure to set the following environment variables in your Railway project:

- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Secret for session management
- `NODE_ENV` - Set to `production`
- `NOWPAYMENTS_API_KEY` - Your NOWPayments API key (if applicable)
- `NOWPAYMENTS_IPN_SECRET_KEY` - Your NOWPayments IPN secret key (if applicable)

You can set these in the Railway dashboard under the "Variables" tab of your project.

### 5. Set Up the Database

Railway provides PostgreSQL as a service. You can create a PostgreSQL database and link it to your project:

1. In the Railway dashboard, click "New"
2. Select "PostgreSQL"
3. Once created, link it to your project
4. Railway will automatically set the `DATABASE_URL` environment variable

### 6. Verify Deployment

Once deployed, your application will be available at the URL provided by Railway.

## Troubleshooting

### Error: Could not find compiled routes.js in dist directory

Make sure you've run the build script (`node build.js`) before deploying. This error occurs when the compiled server files are missing.

### Connection Issues with the Database

Check that your `DATABASE_URL` environment variable is correctly set and the database is accessible from your Railway project.

### Session Management Issues

The application uses secure cookies for session management. In production, cookies are set with `secure: true` which requires HTTPS. Railway automatically provisions HTTPS for your application.

## Further Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway PostgreSQL Documentation](https://docs.railway.app/databases/postgresql)
- [Express.js Deployment Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)

## Contact Support

If you encounter any issues deploying your application, please reach out to the Railway support team or review their documentation for more assistance.