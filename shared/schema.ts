import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
});

export const chickens = pgTable("chickens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // baby, regular, golden
  lastHatchTime: timestamp("last_hatch_time"),
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
  boxType: text("box_type").notNull().default("basic"), // basic, advanced, legendary
  rewardType: text("reward_type").notNull(), // usdt, chicken, resources
  rewardValue: text("reward_value").notNull(), // JSON string with details
  opened: boolean("opened").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  farmName: text("farm_name"),
  avatarColor: text("avatar_color").default("#6366F1"), // Default indigo color
  avatarStyle: text("avatar_style").default("default"),
  farmBackground: text("farm_background").default("default"),
  lastUpdated: timestamp("last_updated").notNull().defaultNow(),
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

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
    referredBy: true,
  })
  .extend({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    referredBy: z.string().nullish(),
  })
  .partial({
    referredBy: true,
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
  mysteryBoxPrice: number;
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
  level2: 0.05,  // 5% for second level
  level3: 0.03,  // 3% for third level
  level4: 0.02,  // 2% for fourth level
  level5: 0.01,  // 1% for fifth level
  level6: 0.005  // 0.5% for sixth level
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

// Mystery box types and prices
export const mysteryBoxTypes = {
  basic: { 
    price: 5, 
    name: "Basic Mystery Box",
    rewards: {
      eggs: {
        ranges: [
          { min: 5, max: 10, chance: 0.50 }, // 50% chance
          { min: 11, max: 15, chance: 0.40 }, // 40% chance
          { min: 16, max: 20, chance: 0.10 }, // 10% chance
        ]
      }
    }
  },
  advanced: { 
    price: 10, 
    name: "Advanced Mystery Box",
    rewards: {
      eggs: {
        ranges: [
          { min: 10, max: 20, chance: 0.40 }, // 40% chance
          { min: 21, max: 35, chance: 0.35 }, // 35% chance
          { min: 36, max: 50, chance: 0.20 }, // 20% chance
        ]
      },
      chicken: {
        types: ["baby"],
        chance: 0.05 // 5% chance for baby chicken
      }
    }
  },
  legendary: { 
    price: 25, 
    name: "Legendary Mystery Box",
    rewards: {
      eggs: {
        ranges: [
          { min: 50, max: 100, chance: 0.35 }, // 35% chance
          { min: 101, max: 150, chance: 0.30 }, // 30% chance
          { min: 151, max: 200, chance: 0.22 }, // 22% chance
        ]
      },
      chicken: {
        types: ["rare"],
        chance: 0.10 // 10% chance for rare chicken
      },
      usdt: {
        amount: 5,
        chance: 0.03 // 3% chance for USDT cashback
      }
    }
  }
};

// Boost types, prices, and durations
export const boostTypes = [
  { id: "2x_1h", name: "2x Egg Production (1 Hour)", multiplier: 2.0, hours: 1, price: 10 },
  { id: "1.5x_6h", name: "1.5x Egg Production (6 Hours)", multiplier: 1.5, hours: 6, price: 20 },
  { id: "1.2x_24h", name: "1.2x Egg Production (24 Hours)", multiplier: 1.2, hours: 24, price: 30 }
];