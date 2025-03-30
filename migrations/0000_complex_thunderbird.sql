CREATE TABLE "achievement_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"icon_svg" text NOT NULL,
	"rarity" text NOT NULL,
	"threshold" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "achievement_badges_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "active_boosts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"multiplier" numeric(4, 2) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chickens" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"last_hatch_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"status" text DEFAULT 'alive' NOT NULL,
	"death_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "daily_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"day" integer NOT NULL,
	"eggs" integer DEFAULT 0 NOT NULL,
	"usdt" numeric(10, 2) DEFAULT '0',
	"claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "milestone_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"milestone" numeric(10, 2) NOT NULL,
	"reward" numeric(10, 2) NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	"claimed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mystery_box_rewards" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"box_type" text NOT NULL,
	"reward_type" text NOT NULL,
	"reward_details" jsonb NOT NULL,
	"rarity" text NOT NULL,
	"opened" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"claimed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_type" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	CONSTRAINT "prices_item_type_unique" UNIQUE("item_type")
);
--> statement-breakpoint
CREATE TABLE "referral_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"referred_user_id" integer NOT NULL,
	"level" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"claimed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"water_buckets" integer DEFAULT 0 NOT NULL,
	"wheat_bags" integer DEFAULT 0 NOT NULL,
	"eggs" integer DEFAULT 0 NOT NULL,
	"mystery_boxes" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "salary_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"period" text NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "spin_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"spin_type" text NOT NULL,
	"reward_type" text NOT NULL,
	"reward_amount" numeric(10, 2) NOT NULL,
	"chicken_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"status" text NOT NULL,
	"transaction_id" text,
	"referral_commission" numeric(10, 2),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"bank_details" text
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_id" integer NOT NULL,
	"unlocked_at" timestamp DEFAULT now() NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"is_complete" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"farm_name" text,
	"avatar_color" text DEFAULT '#6366F1',
	"avatar_style" text DEFAULT 'default',
	"farm_background" text DEFAULT 'default',
	"tutorial_completed" boolean DEFAULT false NOT NULL,
	"tutorial_step" integer DEFAULT 0 NOT NULL,
	"tutorial_disabled" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"displayed_badge_id" integer,
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"usdt_balance" numeric(10, 2) DEFAULT '0' NOT NULL,
	"referral_code" text NOT NULL,
	"referred_by" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp,
	"total_referral_earnings" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_team_earnings" numeric(10, 2) DEFAULT '0' NOT NULL,
	"last_salary_paid_at" timestamp,
	"last_daily_reward_at" date,
	"current_streak" integer DEFAULT 0 NOT NULL,
	"last_spin_at" timestamp,
	"extra_spins_available" integer DEFAULT 0 NOT NULL,
	"referral_count" integer DEFAULT 0 NOT NULL,
	"telegram_id" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_referral_code_unique" UNIQUE("referral_code")
);
