import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from 'cors';

const app = express();
// Allow any origin in development to help with Replit preview
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://chickfarms.replit.app', 'https://chickfarms.com'] 
    : true,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Make sure we're setting the correct Content-Type header for API responses
  app.use('/api', (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
  });
  
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Server error:", err);
    
    // Make sure the content type is set to application/json for API error responses
    res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client
  // Use Replit's port environment variable if available, otherwise default to 5000
  const port = process.env.PORT || 5000;
  
  console.log("Starting server on port", port);
  
  // Add a test route that's easy to access
  app.get('/test', (req, res) => {
    res.send('Server is working!');
  });
  
  // Add a root route that returns a simple response to verify server is up
  app.get('/', (req, res, next) => {
    // For API requests, pass to the next handler
    if (req.path === '/api') {
      return next();
    }
    
    // Only respond with text for direct root requests (not handled by Vite)
    if (req.headers.accept && !req.headers.accept.includes('text/html')) {
      return res.send('ChickFarms API Server is running');
    }
    
    // Let Vite or static serving handle the HTML response
    next();
  });
  
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    console.log(`Server is listening on http://0.0.0.0:${port}`);
    console.log(`Environment: ${app.get("env")}`);
    console.log(`Open in browser: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  });
})();
