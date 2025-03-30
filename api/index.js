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

// Set up CORS - include both the Vercel URL and custom domains
const allowedOrigins = [
  'http://localhost:3000',
  'https://chiket.vercel.app'
];

if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      console.log(`CORS blocked for origin: ${origin}`);
      return callback(null, true); // Allow all origins in production for now
    }
    
    return callback(null, true);
  },
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
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Parse JSON request bodies
app.use(express.json());

// Debug request information
app.use((req, res, next) => {
  console.log(`[Vercel API] ${req.method} ${req.path}`);
  console.log(`[Vercel API] Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Set up authentication
setupAuth(app);

// Register API routes
registerRoutes(app);

// Create serverless handler
const handler = serverless(app);

// Export the handler function for Vercel
export default async function (req, res) {
  return await handler(req, res);
}