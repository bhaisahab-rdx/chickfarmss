import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Add spin rewards configuration
export interface SpinRewardType {
  reward: {
    type: "eggs" | "wheat" | "water" | "usdt" | "extra_spin" | "chicken";
    amount: number;
    chickenType?: string;
  };
  probability: number;
}

export const dailySpinRewards: SpinRewardType[] = [
  { reward: { type: "eggs", amount: 5 }, probability: 25 },
  { reward: { type: "eggs", amount: 10 }, probability: 20 },
  { reward: { type: "eggs", amount: 15 }, probability: 15 },
  { reward: { type: "wheat", amount: 5 }, probability: 15 },
  { reward: { type: "water", amount: 5 }, probability: 15 },
  { reward: { type: "extra_spin", amount: 1 }, probability: 5 },
  { reward: { type: "usdt", amount: 0.5 }, probability: 4 },
  { reward: { type: "usdt", amount: 1 }, probability: 1 }
];

export const superJackpotRewards: SpinRewardType[] = [
  { reward: { type: "eggs", amount: 50 }, probability: 30 },
  { reward: { type: "eggs", amount: 100 }, probability: 20 },
  { reward: { type: "eggs", amount: 200 }, probability: 15 },
  { reward: { type: "usdt", amount: 5 }, probability: 10 },
  { reward: { type: "chicken", amount: 1, chickenType: "regular" }, probability: 10 },
  { reward: { type: "chicken", amount: 1, chickenType: "golden" }, probability: 5 },
  { reward: { type: "usdt", amount: 25 }, probability: 3 },
  { reward: { type: "usdt", amount: 50 }, probability: 2 },
  { 
    reward: { 
      type: "chicken", 
      amount: 1, 
      chickenType: "golden",
    }, 
    probability: 1 
  }
];

// Adding rarityDistribution to the mysteryBox type interface
export interface MysteryBoxType {
  price: number;
  name: string;
  description: string;
  rewards: {
    resources?: {
      wheat?: {
        ranges: { min: number; max: number; chance: number; }[];
      };
      water?: {
        ranges: { min: number; max: number; chance: number; }[];
      };
    };
    eggs?: {
      ranges: { min: number; max: number; chance: number; }[];
    };
    chicken?: {
      types: string[];
      chance: number;
    };
    usdt?: {
      ranges: { amount: number; chance: number; }[];
    };
  };
  rarityDistribution: {
    common?: number;
    rare?: number;
    epic?: number;
    legendary?: number;
  };
}

export const mysteryBoxTypes: Record<string, MysteryBoxType> = {
  basic: { 
    price: 10,
    name: "Basic Box",
    description: "A starter mystery box with common resources",
    rewards: {
      resources: {
        wheat: {
          ranges: [
            { min: 10, max: 50, chance: 0.4 }, // 40% chance
            { min: 5, max: 20, chance: 0.3 }   // 30% chance
          ]
        },
        water: {
          ranges: [
            { min: 5, max: 20, chance: 0.4 },  // 40% chance
            { min: 3, max: 10, chance: 0.3 }   // 30% chance
          ]
        }
      },
      eggs: {
        ranges: [
          { min: 1, max: 5, chance: 0.3 }      // 30% chance
        ]
      }
    },
    rarityDistribution: {
      common: 0.7,    // 70% chance
      rare: 0.3       // 30% chance
    }
  },
  silver: { 
    price: 25,
    name: "Silver Box",
    description: "Enhanced rewards with chance for a baby chicken",
    rewards: {
      resources: {
        wheat: {
          ranges: [
            { min: 50, max: 150, chance: 0.35 },  // 35% chance
            { min: 25, max: 75, chance: 0.25 }    // 25% chance
          ]
        },
        water: {
          ranges: [
            { min: 20, max: 50, chance: 0.35 },   // 35% chance
            { min: 10, max: 25, chance: 0.25 }    // 25% chance
          ]
        }
      },
      eggs: {
        ranges: [
          { min: 5, max: 15, chance: 0.2 }        // 20% chance
        ]
      },
      chicken: {
        types: ["baby"],
        chance: 0.1                               // 10% chance
      }
    },
    rarityDistribution: {
      common: 0.5,     // 50% chance
      rare: 0.4,       // 40% chance
      epic: 0.1        // 10% chance
    }
  },
  golden: {
    price: 50,
    name: "Golden Box",
    description: "Premium rewards with guaranteed resources and high-value items",
    rewards: {
      resources: {
        wheat: {
          ranges: [
            { min: 150, max: 300, chance: 0.3 },  // 30% chance
            { min: 75, max: 150, chance: 0.3 }    // 30% chance
          ]
        },
        water: {
          ranges: [
            { min: 50, max: 100, chance: 0.3 },   // 30% chance
            { min: 25, max: 50, chance: 0.3 }     // 30% chance
          ]
        }
      },
      eggs: {
        ranges: [
          { min: 15, max: 30, chance: 0.2 }       // 20% chance
        ]
      },
      chicken: {
        types: ["regular"],
        chance: 0.15                              // 15% chance
      },
      usdt: {
        ranges: [
          { amount: 5, chance: 0.05 }             // 5% USDT bonus
        ]
      }
    },
    rarityDistribution: {
      common: 0.3,     // 30% chance
      rare: 0.4,       // 40% chance
      epic: 0.2,       // 20% chance
      legendary: 0.1   // 10% chance
    }
  },
  diamond: {
    price: 100,
    name: "Diamond Box",
    description: "Legendary box with the highest value rewards",
    rewards: {
      resources: {
        wheat: {
          ranges: [
            { min: 300, max: 500, chance: 0.25 },  // 25% chance
            { min: 150, max: 300, chance: 0.25 }   // 25% chance
          ]
        },
        water: {
          ranges: [
            { min: 100, max: 200, chance: 0.25 },  // 25% chance
            { min: 50, max: 100, chance: 0.25 }    // 25% chance
          ]
        }
      },
      eggs: {
        ranges: [
          { min: 30, max: 50, chance: 0.2 }        // 20% chance
        ]
      },
      chicken: {
        types: ["golden"],
        chance: 0.2                                // 20% chance
      },
      usdt: {
        ranges: [
          { amount: 10, chance: 0.1 }              // 10% USDT bonus
        ]
      }
    },
    rarityDistribution: {
      rare: 0.3,       // 30% chance
      epic: 0.5,       // 50% chance
      legendary: 0.2   // 20% chance
    }
  }
};

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  usdtBalance: decimal("usdt_balance", { precision: 10, scale: 2 }).notNull().default("0"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  isAdmin: boolean("is_admin").notNull().default(false),
  lastLoginAt: timestamp("last_login_at"),
  totalReferralEarnings: decimal("total_referral_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  totalTeamEarnings: decimal("total_team_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  lastSalaryPaidAt: timestamp("last_salary_paid_at"),
  lastDailyRewardAt: date("last_daily_reward_at"),
  currentStreak: integer("current_streak").notNull().default(0),
  lastSpinAt: timestamp("last_spin_at"),
  extraSpinsAvailable: integer("extra_spins_available").notNull().default(0),
  referralCount: integer("referral_count").notNull().default(0),
  telegramId: text("telegram_id"), // Store user's Telegram ID for notifications
});

// Define chicken lifespan constants
export const CHICKEN_LIFESPAN = {
  baby: 40 * 24 * 60 * 60 * 1000, // 40 days in milliseconds
  regular: null, // Unlimited lifespan
  golden: null // Unlimited lifespan
};

export const chickens = pgTable("chickens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // baby, regular, golden
  lastHatchTime: timestamp("last_hatch_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  status: text("status").notNull().default("alive"), // alive or dead
  deathDate: timestamp("death_date"), // Only for baby chickens that have died
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  waterBuckets: integer("water_buckets").notNull().default(0),
  wheatBags: integer("wheat_bags").notNull().default(0),
  eggs: integer("eggs").notNull().default(0),
  mysteryBoxes: integer("mystery_boxes").notNull().default(0),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // recharge, withdrawal, purchase, commission, mystery_box
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull(), // pending, completed, rejected
  transactionId: text("transaction_id"),
  referralCommission: decimal("referral_commission", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  bankDetails: text("bank_details"), // JSON string containing bank account details
});

export const gameSettings = pgTable("game_settings", {
  id: serial("id").primaryKey(),
  settingKey: text("setting_key").notNull().unique(),
  settingValue: text("setting_value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const prices = pgTable("prices", {
  id: serial("id").primaryKey(),
  itemType: text("item_type").notNull().unique(), // chicken types, resources, eggs, mystery_box
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const mysteryBoxRewards = pgTable("mystery_box_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  boxType: text("box_type").notNull(),
  rewardType: text("reward_type").notNull(), // "resource", "chicken", "egg", "usdt"
  rewardDetails: jsonb("reward_details").notNull(), // Detailed reward information
  rarity: text("rarity").notNull(), // common, rare, epic, legendary
  opened: boolean("opened").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  claimedAt: timestamp("claimed_at"),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  farmName: text("farm_name"),
  avatarColor: text("avatar_color").default("#6366F1"), // Default indigo color
  avatarStyle: text("avatar_style").default("default"),
  farmBackground: text("farm_background").default("default"),
  tutorialCompleted: boolean("tutorial_completed").notNull().default(false),
  tutorialStep: integer("tutorial_step").notNull().default(0),
  tutorialDisabled: boolean("tutorial_disabled").notNull().default(false),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
  displayedBadgeId: integer("displayed_badge_id"),
});

export const referralEarnings = pgTable("referral_earnings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  referredUserId: integer("referred_user_id").notNull(),
  level: integer("level").notNull(), // 1-6 levels
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  claimed: boolean("claimed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const milestoneRewards = pgTable("milestone_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  milestone: decimal("milestone", { precision: 10, scale: 2 }).notNull(), // $1000, $10000, etc.
  reward: decimal("reward", { precision: 10, scale: 2 }).notNull(),
  claimed: boolean("claimed").notNull().default(false),
  claimedAt: timestamp("claimed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const salaryPayments = pgTable("salary_payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  period: text("period").notNull(), // e.g., "2023-01"
  paidAt: timestamp("paid_at").notNull().defaultNow(),
});

export const dailyRewards = pgTable("daily_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  day: integer("day").notNull(), // 1-7 for the streak day
  eggs: integer("eggs").notNull().default(0),
  usdt: decimal("usdt", { precision: 10, scale: 2 }).default("0"),
  claimed: boolean("claimed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activeBoosts = pgTable("active_boosts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // egg_production, etc.
  multiplier: decimal("multiplier", { precision: 4, scale: 2 }).notNull(), // 1.5, 2.0, etc.
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Add spin history table
export const spinHistory = pgTable("spin_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  spinType: text("spinType").notNull(), // "daily" or "super"
  rewardType: text("rewardType").notNull(), // "eggs", "wheat", "water", "usdt", "extra_spin", "chicken"
  rewardAmount: decimal("reward_amount", { precision: 10, scale: 2 }).notNull(),
  chickenType: text("chickenType"), // For chicken rewards
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Define spin rewards configuration table
export const spinRewards = pgTable("spin_rewards", {
  id: serial("id").primaryKey(),
  spinType: text("spinType").notNull(), // "daily" or "super"
  rewardType: text("rewardType").notNull(), // "eggs", "wheat", "water", "usdt", "extra_spin", "chicken"
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  chickenType: text("chickenType"), // For chicken rewards (if applicable)
  probability: decimal("probability", { precision: 5, scale: 2 }).notNull(), // Percentage chance 0-100
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Add initialization check query
export const DEFAULT_PRICES = [
  { item_type: 'baby_chicken', price: 90.00 },
  { item_type: 'regular_chicken', price: 150.00 },
  { item_type: 'golden_chicken', price: 400.00 },
  { item_type: 'water_bucket', price: 0.50 },
  { item_type: 'wheat_bag', price: 0.50 },
  { item_type: 'egg', price: 0.10 }
];

// Add this after all table definitions but before the exports
export const initializeDefaultsQuery = `
  INSERT INTO prices (item_type, price)
  VALUES ${DEFAULT_PRICES.map(p => `('${p.item_type}', ${p.price})`).join(', ')}
  ON CONFLICT (item_type) DO NOTHING;
`;

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    referredBy: true,
    telegramId: true,
  })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    referredBy: z.string().nullish(),
    telegramId: z.string().nullish(),
  })
  .partial({
    referredBy: true,
    telegramId: true,
  });

export const insertChickenSchema = createInsertSchema(chickens);
export const insertResourceSchema = createInsertSchema(resources);
export const insertTransactionSchema = createInsertSchema(transactions)
  .extend({
    amount: z.number()
      .min(0.01, "Amount must be greater than 0")
      .max(1000000, "Amount cannot exceed 1,000,000"),
    type: z.enum(["recharge", "withdrawal", "purchase", "commission", "mystery_box"]),
    status: z.enum(["pending", "completed", "rejected"]),
    bankDetails: z.string().nullish(),
  });
export const insertPriceSchema = createInsertSchema(prices);
export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  lastUpdated: true,
});

export const insertGameSettingSchema = createInsertSchema(gameSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertMysteryBoxRewardSchema = createInsertSchema(mysteryBoxRewards).omit({
  id: true,
  createdAt: true,
  claimedAt: true,
});

export const insertReferralEarningSchema = createInsertSchema(referralEarnings).omit({
  id: true,
  createdAt: true,
});

export const insertMilestoneRewardSchema = createInsertSchema(milestoneRewards).omit({
  id: true,
  claimedAt: true,
  createdAt: true,
});

export const insertSalaryPaymentSchema = createInsertSchema(salaryPayments).omit({
  id: true,
  paidAt: true,
});

export const insertDailyRewardSchema = createInsertSchema(dailyRewards).omit({
  id: true,
  createdAt: true,
});

export const insertActiveBoostSchema = createInsertSchema(activeBoosts).omit({
  id: true,
  createdAt: true,
});

export const insertSpinHistorySchema = createInsertSchema(spinHistory).omit({
  id: true,
  createdAt: true,
});

export const insertSpinRewardSchema = createInsertSchema(spinRewards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});


export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Chicken = typeof chickens.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Price = typeof prices.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type GameSetting = typeof gameSettings.$inferSelect;
export type MysteryBoxReward = typeof mysteryBoxRewards.$inferSelect;
export type InsertMysteryBoxReward = z.infer<typeof insertMysteryBoxRewardSchema>;
export type ReferralEarning = typeof referralEarnings.$inferSelect;
export type MilestoneReward = typeof milestoneRewards.$inferSelect;
export type SalaryPayment = typeof salaryPayments.$inferSelect;
export type DailyReward = typeof dailyRewards.$inferSelect;
export type ActiveBoost = typeof activeBoosts.$inferSelect;

export type InsertReferralEarning = z.infer<typeof insertReferralEarningSchema>;
export type InsertMilestoneReward = z.infer<typeof insertMilestoneRewardSchema>;
export type InsertSalaryPayment = z.infer<typeof insertSalaryPaymentSchema>;
export type InsertDailyReward = z.infer<typeof insertDailyRewardSchema>;
export type InsertActiveBoost = z.infer<typeof insertActiveBoostSchema>;
export type SpinHistory = typeof spinHistory.$inferSelect;
export type InsertSpinHistory = z.infer<typeof insertSpinHistorySchema>;
export type SpinReward = typeof spinRewards.$inferSelect;
export type InsertSpinReward = z.infer<typeof insertSpinRewardSchema>;


// Admin types
export interface AdminStats {
  todayLogins: number;
  yesterdayLogins: number;
  totalUsers: number;
  todayDeposits: number;
  totalDeposits: number;
  pendingWithdrawals: number;
}

export interface BankDetails {
  accountNumber: string;
  ifsc: string;
  accountName: string;
}

export interface USDTWithdrawal {
  amount: number;
  usdtAddress: string;
}

export interface GamePrices {
  waterBucketPrice: number;
  wheatBagPrice: number;
  eggPrice: number;
  babyChickenPrice: number;
  regularChickenPrice: number;
  goldenChickenPrice: number;
  // Mystery box prices
  mysteryBoxPrice: number;
  basicMysteryBoxPrice: number;
  standardMysteryBoxPrice: number;
  advancedMysteryBoxPrice: number;
  legendaryMysteryBoxPrice: number;
  withdrawalTaxPercentage: number;
}

export interface MysteryBoxContent {
  rewardType: "usdt" | "chicken" | "resources" | "eggs"; 
  amount?: number;         // For USDT rewards
  chickenType?: string;    // For chicken rewards
  resourceType?: string;   // For resource rewards
  resourceAmount?: number; // For resource rewards
  minEggs?: number;
  maxEggs?: number;
}

export const possibleMysteryBoxRewards = [
  { rewardType: "usdt", min: 1, max: 50 },
  { rewardType: "chicken", types: ["baby", "regular", "golden"] },
  { rewardType: "resources", types: [
    { type: "water_buckets", min: 5, max: 20 },
    { type: "wheat_bags", min: 5, max: 20 }
  ]}
];

// Multi-level referral commission rates
export const referralCommissionRates = {
  level1: 0.10,  // 10% for direct referrals
  level2: 0.06,  // 6% for second level
  level3: 0.04,  // 4% for third level
  level4: 0.03,  // 3% for fourth level
  level5: 0.02,  // 2% for fifth level
  level6: 0.01   // 1% for sixth level
};

// Team milestone thresholds and rewards
export const milestoneThresholds = [
  { threshold: 1000, reward: 50 },      // $1,000 total referral earnings -> $50 bonus
  { threshold: 10000, reward: 500 },    // $10,000 -> $500 bonus
  { threshold: 50000, reward: 2500 },   // $50,000 -> $2,500 bonus
  { threshold: 100000, reward: 5000 }   // $100,000 -> $5,000 bonus
];

// Monthly salary calculation
// Each referral who made their first deposit counts as $1 in monthly salary
// For example: 100 referrals = $100/month, 500 referrals = $500/month
export const SALARY_PER_REFERRAL = 1; // $1 per referral with deposit

// Daily rewards by streak day
export const dailyRewardsByDay = [
  { day: 1, eggs: 2, usdt: 0 },
  { day: 2, eggs: 4, usdt: 0 },
  { day: 3, eggs: 6, usdt: 0 },
  { day: 4, eggs: 8, usdt: 0 },
  { day: 5, eggs: 10, usdt: 0.5 },
  { day: 6, eggs: 15, usdt: 0.75 },
  { day: 7, eggs: 20, usdt: 1 }        // Weekly bonus
];

// Boost types, prices, and durations
export const boostTypes = [
  { id: "2x_1h", name: "2x Egg Production (1 Hour)", multiplier: 2.0, hours: 1, price: 10 },
  { id: "1.5x_6h", name: "1.5x Egg Production (6 Hours)", multiplier: 1.5, hours: 6, price: 20 },
  { id: "1.2x_24h", name: "1.2x Egg Production (24 Hours)", multiplier: 1.2, hours: 24, price: 30 }
];

// Achievement badge system
export const achievementBadges = pgTable("achievement_badges", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(), // Unique identifier code for the badge
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'investment', 'farming', 'social', 'milestone'
  iconSvg: text("icon_svg").notNull(), // SVG string for the badge icon
  rarity: text("rarity").notNull(), // 'common', 'rare', 'epic', 'legendary'
  threshold: integer("threshold").notNull(), // Value needed to unlock
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User achievement records
export const userAchievements = pgTable("user_achievements", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  badgeId: integer("badge_id").notNull(),
  unlockedAt: timestamp("unlocked_at").notNull().defaultNow(),
  progress: integer("progress").notNull().default(0), // Current progress towards threshold
  isComplete: boolean("is_complete").notNull().default(false),
});

// Create insert schemas for the badges tables
export const insertAchievementBadgeSchema = createInsertSchema(achievementBadges).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

// Achievement badge types
export type AchievementBadge = typeof achievementBadges.$inferSelect;
export type InsertAchievementBadge = z.infer<typeof insertAchievementBadgeSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;

// Achievement badge definitions with crypto themes
export interface AchievementBadgeDefinition {
  code: string;
  name: string;
  description: string;
  category: 'investment' | 'farming' | 'social' | 'milestone';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  threshold: number;
  iconSvg: string; // Will be actual SVG content
}

// Default achievement badges
export const DEFAULT_ACHIEVEMENT_BADGES: AchievementBadgeDefinition[] = [
  // Investment category badges
  {
    code: "first_deposit",
    name: "Crypto Initiate",
    description: "Made your first USDT deposit",
    category: "investment",
    rarity: "common",
    threshold: 1,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#26a17b"/><path fill="#fff" d="M36.5,17.2h-9v18.6h9V17.2z"/><path fill="#fff" d="M32,11.6c-8.1,0-14.6,6.6-14.6,14.6s6.6,14.6,14.6,14.6s14.6-6.6,14.6-14.6S40.1,11.6,32,11.6z M32,37.1c-6,0-10.9-4.9-10.9-10.9c0-6,4.9-10.9,10.9-10.9c6,0,10.9,4.9,10.9,10.9C42.9,32.2,38,37.1,32,37.1z"/><path fill="#fff" d="M42.1,39.6c-0.5,0-0.9,0.4-0.9,0.9v2.2c0,0.5,0.4,0.9,0.9,0.9s0.9-0.4,0.9-0.9v-2.2C43,40,42.6,39.6,42.1,39.6z"/></svg>'
  },
  {
    code: "hodler",
    name: "HODL Champion", 
    description: "Held a balance of 100+ USDT",
    category: "investment",
    rarity: "rare",
    threshold: 100,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#f9aa4b"/><path fill="#fff" d="M32,12.4l-8.9,15.3L32,33.1l8.9-5.4L32,12.4z"/><path fill="#fff" d="M32,35.2L23.1,29.8L32,51.6l8.9-21.8L32,35.2z"/><path fill="#fff" d="M32,33.1l8.9-5.4l-8.9-5.3V33.1z"/><path fill="#fff" d="M23.1,22.4l8.9,5.3v-10.7L23.1,22.4z"/></svg>'
  },
  {
    code: "crypto_whale",
    name: "Crypto Whale",
    description: "Achieved a balance of 1000+ USDT",
    category: "investment",
    rarity: "epic",
    threshold: 1000,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#627eea"/><path fill="#fff" d="M32,13v14l11.9,5.3L32,13z"/><path fill="#fff" fill-opacity="0.8" d="M32,13l-11.9,19.3L32,27V13z"/><path fill="#fff" d="M32,41.7v9.3l11.9-16.5L32,41.7z"/><path fill="#fff" fill-opacity="0.8" d="M32,51v-9.3l-11.9-7.2L32,51z"/><path fill="#fff" d="M32,39.3l11.9-7.2L32,27V39.3z"/><path fill="#fff" fill-opacity="0.8" d="M20.1,32.1L32,39.3V27L20.1,32.1z"/></svg>'
  },
  
  // Farming category badges
  {
    code: "egg_collector",
    name: "Egg Collector",
    description: "Collected 100 eggs from your chickens",
    category: "farming",
    rarity: "common",
    threshold: 100,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#f0b90b"/><ellipse cx="32" cy="35" rx="14" ry="16" fill="#fff"/><path fill="#f0b90b" d="M32,20c-7.7,0-14,6.7-14,15s6.3,15,14,15s14-6.7,14-15S39.7,20,32,20z M32,45c-5.5,0-10-4.5-10-10s4.5-10,10-10s10,4.5,10,10S37.5,45,32,45z"/><circle cx="32" cy="35" r="6" fill="#f0b90b"/></svg>'
  },
  {
    code: "chicken_master",
    name: "Chicken Master",
    description: "Owned 10 or more chickens simultaneously",
    category: "farming",
    rarity: "rare",
    threshold: 10,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#ff9900"/><path fill="#fff" d="M42,27c0,5.5-4.5,10-10,10s-10-4.5-10-10s4.5-10,10-10S42,21.5,42,27z"/><path fill="#fff" d="M24,35c0,0-4,4-4,8s2,6,2,6h20c0,0,2-2,2-6s-4-8-4-8"/><circle cx="28" cy="26" r="2" fill="#ff9900"/><circle cx="36" cy="26" r="2" fill="#ff9900"/><path fill="#ff9900" d="M29,30h6c0,0,0,2-3,2S29,30,29,30z"/></svg>'
  },
  {
    code: "golden_farm",
    name: "Golden Farm",
    description: "Owned 5 golden chickens simultaneously",
    category: "farming",
    rarity: "legendary",
    threshold: 5,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#f7931a"/><path fill="#fff" d="M42,32c0,5.5-4.5,10-10,10s-10-4.5-10-10s4.5-10,10-10S42,26.5,42,32z"/><path fill="#f7931a" d="M39,37c0,0-4,10-16,10c0,0,10-4,10-10H39z"/><path fill="#f7931a" d="M25,37c0,0,4,10,16,10c0,0-10-4-10-10H25z"/><path fill="#f7931a" d="M37,25c0,0-3-5-5-5s-5,5-5,5s2-3,5-3S37,25,37,25z"/><path fill="#fff" d="M32,27l-4,5h8L32,27z"/></svg>'
  },

  // Social category badges
  {
    code: "referral_starter",
    name: "Blockchain Ambassador",
    description: "Invited your first referral",
    category: "social",
    rarity: "common",
    threshold: 1,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#3c3c3d"/><circle cx="24" cy="26" r="6" fill="#fff"/><circle cx="40" cy="26" r="6" fill="#fff"/><circle cx="32" cy="42" r="6" fill="#fff"/><path stroke="#fff" stroke-width="2" d="M24,26L32,42L40,26" fill="none"/><path stroke="#fff" stroke-width="2" d="M24,26L40,26" fill="none"/></svg>'
  },
  {
    code: "network_builder",
    name: "Network Builder",
    description: "Built a referral network of 10+ users",
    category: "social",
    rarity: "epic",
    threshold: 10,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#8247e5"/><circle cx="32" cy="22" r="5" fill="#fff"/><circle cx="22" cy="38" r="5" fill="#fff"/><circle cx="42" cy="38" r="5" fill="#fff"/><path stroke="#fff" stroke-width="2" d="M32,27L22,33" fill="none"/><path stroke="#fff" stroke-width="2" d="M32,27L42,33" fill="none"/><path stroke="#fff" stroke-width="2" d="M22,43L42,43" fill="none"/></svg>'
  },

  // Milestone category badges
  {
    code: "daily_streak",
    name: "Blockchain Miner",
    description: "Maintained a login streak of 7 days",
    category: "milestone",
    rarity: "common",
    threshold: 7,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#4285f4"/><rect x="22" y="22" width="20" height="20" rx="2" fill="#fff"/><path fill="#4285f4" d="M36,28h-8c-1.1,0-2,0.9-2,2v4c0,1.1,0.9,2,2,2h8c1.1,0,2-0.9,2-2v-4C38,28.9,37.1,28,36,28z M35,33h-6v-2h6V33z"/><path fill="#4285f4" d="M30,22v-4h4v4H30z"/><path fill="#4285f4" d="M30,46v-4h4v4H30z"/><path fill="#4285f4" d="M46,30h-4v4h4V30z"/><path fill="#4285f4" d="M22,30h-4v4h4V30z"/></svg>'
  },
  {
    code: "super_spinner",
    name: "Super Spinner",
    description: "Spun the super jackpot wheel 10 times",
    category: "milestone",
    rarity: "rare",
    threshold: 10,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#2a71d0"/><circle cx="32" cy="32" r="20" fill="#fff"/><path fill="#2a71d0" d="M32,12v40c11,0,20-9,20-20S43,12,32,12z"/><path fill="#fff" d="M32,22v20c-5.5,0-10-4.5-10-10S26.5,22,32,22z"/><path fill="#2a71d0" d="M32,22v20c5.5,0,10-4.5,10-10S37.5,22,32,22z"/><circle cx="27" cy="27" r="3" fill="#fff"/><circle cx="37" cy="37" r="3" fill="#fff"/></svg>'
  },
  {
    code: "mystery_master",
    name: "Mystery Box Master",
    description: "Opened 25 mystery boxes",
    category: "milestone",
    rarity: "epic",
    threshold: 25,
    iconSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="#eb8c39"/><rect x="18" y="24" width="28" height="20" rx="2" fill="#fff"/><path fill="#eb8c39" d="M32,20l-10,4h20L32,20z"/><path fill="#eb8c39" d="M24,30h16v4H24V30z"/><circle cx="32" cy="38" r="2" fill="#eb8c39"/></svg>'
  }
];

// We already have spin reward definitions at the top of the file