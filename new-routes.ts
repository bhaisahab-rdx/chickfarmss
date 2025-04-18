import { Express, Request, Response, NextFunction } from "express";
import { Server, createServer } from "http";
import { setupAuth, isAuthenticated } from "./server/auth";
import { storage, mysteryBoxTypes } from "./server/storage";
import { z } from "zod";
import { dailySpinRewards, superJackpotRewards, referralCommissionRates } from "./shared/schema";
// NOWPayments integration has been removed
import { config } from "./server/config";
import crypto from 'crypto';

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Health endpoint for monitoring
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });
  
  // Test endpoint for API testing
  app.get("/api/test", (req, res) => {
    console.log("[API] Test endpoint accessed");
    res.json({ 
      status: "ok",
      message: "API is working properly",
      timestamp: new Date().toISOString(),
      apiVersion: "1.0.0"
    });
  });
  
  // Test health endpoint to verify application is working
  app.get("/api/test-health", (req, res) => {
    console.log("[API] Health test endpoint accessed");
    res.json({
      status: "OK",
      message: "Application is running correctly",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      environment: process.env.NODE_ENV || "development"
    });
  });
  
  // Wallet recharge endpoint (NOWPayments integration removed)
  app.post("/api/wallet/recharge", isAuthenticated, async (req, res) => {
    try {
      // Schema to validate input parameters
      const schema = z.object({
        amount: z.number().positive()
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request parameters", details: result.error });
      }
      
      const { amount } = result.data;
      const user = req.user as any;
      
      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      console.log(`[Wallet] Recharge request - User ID: ${user.id}, Amount: ${amount}`);
      
      // Return a message indicating the payment feature has been removed
      return res.status(501).json({ 
        error: "Payment Feature Removed", 
        message: "The cryptocurrency payment feature has been removed from this application."
      });
    } catch (error) {
      console.error("[Wallet] Unexpected error in recharge endpoint:", error);
      res.status(500).json({ error: "An unexpected error occurred. Please try again later." });
    }
  });

  // User authentication endpoints
  app.post("/api/auth/register", async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(30),
        password: z.string().min(6),
        referralCode: z.string().optional(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request parameters", details: result.error });
      }

      const { username, password, referralCode } = result.data;

      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      // If referral code provided, check if it exists
      let referrerId = null;
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referrerId = referrer.id;
        } else {
          return res.status(400).json({ error: "Invalid referral code" });
        }
      }

      // Create user
      const userData = {
        username,
        password,
        referredBy: referrerId,
        isAdmin: false
      };
      
      const user = await storage.createUser(userData);
      
      // Log the user in automatically
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to login after registration" });
        }
        
        return res.status(201).json({
          id: user.id,
          username: user.username,
          referralCode: user.referralCode,
          // Omit password
        });
      });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    // The login is handled by passport, which we'll set up later
    try {
      // Validate input
      const schema = z.object({
        username: z.string(),
        password: z.string(),
      });

      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request parameters", details: result.error });
      }

      // The actual authentication is performed by passport middleware
      // which is configured in auth.ts
      req.body.username = req.body.username.toLowerCase(); // Convert to lowercase for case-insensitive matching
      
      // Continue the chain for passport to handle
      next();
    } catch (error) {
      console.error("Error in login route:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  app.get("/api/user", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Refresh the user data from storage to get the latest values
      const freshUserData = await storage.getUser(user.id);
      if (!freshUserData) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Omit sensitive fields
      const {
        password,
        ...userData
      } = freshUserData;
      
      res.json(userData);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ error: "Failed to fetch user data" });
    }
  });

  // Resources endpoint
  app.get("/api/resources", isAuthenticated, async (req, res) => {
    try {
      const resources = await storage.getResourcesByUserId(req.user!.id);
      res.json(resources);
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });
  
  // Prices endpoint
  app.get("/api/prices", async (req, res) => {
    try {
      const prices = await storage.getPrices();
      res.json(prices);
    } catch (error) {
      console.error("Error fetching prices:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  // Chickens endpoints
  app.get("/api/chickens", isAuthenticated, async (req, res) => {
    try {
      const chickens = await storage.getChickensByUserId(req.user!.id);
      // Ensure we're returning a proper array
      res.json(Array.isArray(chickens) ? chickens : []);
    } catch (error) {
      console.error("Error fetching chickens:", error);
      res.status(500).json({ error: "Failed to fetch chickens" });
    }
  });

  app.get("/api/chickens/counts", async (req, res) => {
    try {
      const counts = await storage.getChickenCountsByType();
      res.json(counts);
    } catch (error) {
      console.error("Error fetching chicken counts:", error);
      res.status(500).json({ error: "Failed to fetch chicken counts" });
    }
  });

  app.post("/api/chickens/buy", isAuthenticated, async (req, res) => {
    try {
      const { type } = req.body;
      if (!type) {
        return res.status(400).json({ error: "Chicken type is required" });
      }

      const chicken = await storage.createChicken(req.user!.id, type);
      res.json(chicken);
    } catch (error) {
      console.error("Error buying chicken:", error);
      res.status(500).json({ error: "Failed to buy chicken" });
    }
  });

  app.post("/api/chickens/:id/hatch", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.updateChickenHatchTime(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error hatching chicken:", error);
      res.status(500).json({ error: "Failed to hatch chicken" });
    }
  });

  app.post("/api/chickens/sell/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteChicken(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error selling chicken:", error);
      res.status(500).json({ error: "Failed to sell chicken" });
    }
  });

  // Spin wheel endpoints
  app.get("/api/spin/status", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const now = new Date();
      const lastSpinTime = user.lastSpinAt ? new Date(user.lastSpinAt) : null;
      
      // Default daily spin configuration
      const spinsAvailable = user.extraSpinsAvailable || 0;
      const canSpin = lastSpinTime === null || 
                     (now.getTime() - lastSpinTime.getTime() >= 24 * 60 * 60 * 1000);

      res.json({
        canSpin,
        lastSpinAt: user.lastSpinAt,
        spinsAvailable,
        rewards: dailySpinRewards,
        superJackpotRewards
      });
    } catch (error) {
      console.error("Error checking spin status:", error);
      res.status(500).json({ error: "Failed to check spin status" });
    }
  });

  // Create the HTTP server without starting it (main index.ts will do that)
  const server = createServer(app);
  return server;
}