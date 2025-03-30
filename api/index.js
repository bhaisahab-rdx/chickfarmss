// Vercel serverless function entry point
import serverless from 'serverless-http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import session from 'express-session';
import { PgStore } from '../server/db.js';
import { config } from '../server/config.js';
import { setupAuth } from '../server/auth.js';
import { registerRoutes } from '../server/routes.js';

// Load environment variables
dotenv.config();

const app = express();

// Set up CORS
app.use(cors({
  origin: process.env.VERCEL_URL ? 
    [`https://${process.env.VERCEL_URL}`, 'https://chickfarms.vercel.app'] : 
    'http://localhost:3000',
  credentials: true
}));

// Configure session
app.use(session({
  store: PgStore,
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Parse JSON request bodies
app.use(express.json());

// Set up authentication
setupAuth(app);

// Register API routes
registerRoutes(app);

// Create serverless handler
const handler = serverless(app);

export default async function (req, res) {
  return await handler(req, res);
}