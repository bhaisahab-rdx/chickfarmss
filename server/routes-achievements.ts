import express from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./auth";

const router = express.Router();

// Get all achievement badges
router.get("/badges", async (req, res) => {
  try {
    const badges = await storage.getAllAchievementBadges();
    res.json(badges);
  } catch (error) {
    console.error("[API] Error getting achievement badges:", error);
    res.status(500).json({ error: "Failed to get achievement badges" });
  }
});

// Get user's achievements
router.get("/user", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const achievements = await storage.getUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error("[API] Error getting user achievements:", error);
    res.status(500).json({ error: "Failed to get user achievements" });
  }
});

// Get completed achievements
router.get("/user/completed", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const achievements = await storage.getCompletedUserAchievements(userId);
    res.json(achievements);
  } catch (error) {
    console.error("[API] Error getting completed achievements:", error);
    res.status(500).json({ error: "Failed to get completed achievements" });
  }
});

// Progress an achievement (only for testing)
router.post("/progress/:code", isAuthenticated, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { code } = req.params;
    const { progress } = req.body;
    
    if (typeof progress !== "number") {
      return res.status(400).json({ error: "Progress must be a number" });
    }
    
    // Get the badge
    const badge = await storage.getAchievementBadgeByCode(code);
    if (!badge) {
      return res.status(404).json({ error: "Achievement badge not found" });
    }
    
    // Check if user already has this achievement
    let userAchievement = await storage.getUserAchievementsByBadgeId(userId, badge.id);
    
    if (!userAchievement) {
      // Create new achievement progress
      userAchievement = await storage.createUserAchievement({
        userId: userId,
        badgeId: badge.id,
        progress: progress,
        isComplete: progress >= badge.threshold
      });
    } else {
      // Update existing achievement progress
      const newProgress = Math.max(userAchievement.progress, progress);
      const isComplete = newProgress >= badge.threshold;
      
      userAchievement = await storage.updateUserAchievement(userAchievement.id, {
        progress: newProgress,
        isComplete: isComplete,
        unlockedAt: isComplete && !userAchievement.isComplete ? new Date() : userAchievement.unlockedAt
      });
    }
    
    res.json(userAchievement);
  } catch (error) {
    console.error("[API] Error progressing achievement:", error);
    res.status(500).json({ error: "Failed to progress achievement" });
  }
});

export default router;