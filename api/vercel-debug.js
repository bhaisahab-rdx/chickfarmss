/**
 * ChickFarms Vercel Deployment Debug Endpoint
 * 
 * This file provides a comprehensive debugging endpoint for Vercel deployments
 * that returns detailed information about the environment, request, and configuration
 * to help troubleshoot issues with the deployed application.
 */

export default function handler(req, res) {
  // Create a safe copy of headers without sensitive information
  const safeHeaders = { ...req.headers };
  if (safeHeaders.authorization) {
    safeHeaders.authorization = '[REDACTED]';
  }
  if (safeHeaders.cookie) {
    safeHeaders.cookie = '[REDACTED]';
  }

  // Information about the request
  const requestInfo = {
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    headers: safeHeaders,
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    body: req.body ? '[BODY_PRESENT]' : null,
  };

  // Information about the environment
  const environmentInfo = {
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    region: process.env.VERCEL_REGION,
    hasSessionSecret: !!process.env.SESSION_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.split('://')[0] : null,
  };

  // Return all diagnostics
  res.status(200).json({
    status: "ok",
    time: new Date().toISOString(),
    requestInfo,
    environmentInfo,
    message: "This endpoint provides debugging information for Vercel deployment. Check if all expected environment variables are present and if the request headers are as expected."
  });
}