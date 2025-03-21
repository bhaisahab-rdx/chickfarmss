import express, { Express } from "express";
import serverless from "serverless-http";
import session from "express-session";
import MemoryStore from "memorystore";
import { setupAuth } from "./server/auth";
import { registerRoutes } from "./server/routes";
import cors from "cors";
import { pool, db } from "./server/db";

const app: Express = express();
const MemoryStoreFactory = MemoryStore(session);

// Middleware
app.use(cors());
app.use(express.json());

// Session Configuration
const sessionSettings = {
  secret: process.env.SESSION_SECRET || 'iYL0Yq&b,LG1gzGa88;0#k]2mtS7)e',
  resave: true,
  saveUninitialized: true,
  store: new MemoryStoreFactory({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  cookie: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/",
    httpOnly: true
  },
  name: "chickfarms.sid",
  rolling: true
};

app.use(session(sessionSettings));

// Auth setup
setupAuth(app);

// Set up API routes
registerRoutes(app);

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  console.error("Server error:", err);
  res.status(status).json({ message });
});

// Export handler for serverless
export const handler = serverless(app);