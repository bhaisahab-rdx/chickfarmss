// Direct server implementation for Vercel
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

// Create Express app
const app = express();

// Set up CORS
app.use(cors({
  origin: ['https://chiket.vercel.app', 'http://localhost:3000'],
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

// Default route
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server if not being imported
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

// Export the app for serverless use
module.exports = app;