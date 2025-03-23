-- ChickFarms Database Setup Script for Supabase
-- Use this in Supabase SQL Editor to set up your database

-- Create tables
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  usdt_balance DECIMAL(10, 2) NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  last_login_at TIMESTAMP,
  total_referral_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_team_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0,
  last_salary_paid_at TIMESTAMP,
  last_daily_reward_at DATE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  last_spin_at TIMESTAMP,
  extra_spins_available INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS chickens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  last_hatch_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS resources (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  water_buckets INTEGER NOT NULL DEFAULT 0,
  wheat_bags INTEGER NOT NULL DEFAULT 0,
  eggs INTEGER NOT NULL DEFAULT 0,
  mystery_boxes INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL, 
  transaction_id TEXT,
  referral_commission DECIMAL(10, 2),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  bank_details TEXT
);

CREATE TABLE IF NOT EXISTS game_settings (
  id SERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prices (
  id SERIAL PRIMARY KEY,
  item_type TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS mystery_box_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  box_type TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_details JSONB NOT NULL,
  rarity TEXT NOT NULL,
  opened BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  farm_name TEXT,
  avatar_color TEXT DEFAULT '#6366F1',
  avatar_style TEXT DEFAULT 'default',
  farm_background TEXT DEFAULT 'default',
  tutorial_completed BOOLEAN NOT NULL DEFAULT FALSE,
  tutorial_step INTEGER NOT NULL DEFAULT 0,
  tutorial_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referral_earnings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  referred_user_id INTEGER NOT NULL,
  level INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milestone_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  milestone DECIMAL(10, 2) NOT NULL,
  reward DECIMAL(10, 2) NOT NULL,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS salary_payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  period TEXT NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS daily_rewards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  day INTEGER NOT NULL,
  eggs INTEGER NOT NULL DEFAULT 0,
  usdt DECIMAL(10, 2) DEFAULT 0,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS active_boosts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  multiplier DECIMAL(4, 2) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS spin_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  spin_type TEXT NOT NULL,
  reward_type TEXT NOT NULL,
  reward_amount DECIMAL(10, 2) NOT NULL,
  chicken_type TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chickens_user_id ON chickens(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_mystery_box_rewards_user_id ON mystery_box_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_earnings_user_id ON referral_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_milestone_rewards_user_id ON milestone_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_payments_user_id ON salary_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_rewards_user_id ON daily_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_active_boosts_user_id ON active_boosts(user_id);
CREATE INDEX IF NOT EXISTS idx_spin_history_user_id ON spin_history(user_id);

-- Add foreign key constraints
ALTER TABLE chickens 
  ADD CONSTRAINT fk_chickens_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE resources 
  ADD CONSTRAINT fk_resources_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE transactions 
  ADD CONSTRAINT fk_transactions_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE mystery_box_rewards 
  ADD CONSTRAINT fk_mystery_box_rewards_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE user_profiles 
  ADD CONSTRAINT fk_user_profiles_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE referral_earnings 
  ADD CONSTRAINT fk_referral_earnings_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE milestone_rewards 
  ADD CONSTRAINT fk_milestone_rewards_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE salary_payments 
  ADD CONSTRAINT fk_salary_payments_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE daily_rewards 
  ADD CONSTRAINT fk_daily_rewards_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE active_boosts 
  ADD CONSTRAINT fk_active_boosts_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE spin_history 
  ADD CONSTRAINT fk_spin_history_user_id 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Insert default prices
INSERT INTO prices (item_type, price)
VALUES 
  ('baby_chicken', 90.00),
  ('regular_chicken', 150.00),
  ('golden_chicken', 400.00),
  ('water_bucket', 0.50),
  ('wheat_bag', 0.50),
  ('egg', 0.10)
ON CONFLICT (item_type) DO NOTHING;

-- Insert default game settings
INSERT INTO game_settings (setting_key, setting_value)
VALUES
  ('payment_address', 'TRX8nHHo2Jd7H9ZwKhh6h8h'),
  ('withdrawal_tax', '5')
ON CONFLICT (setting_key) DO NOTHING;

-- Create admin user with password "admin123" (change this in production!)
INSERT INTO users (username, password, referral_code, is_admin)
VALUES (
  'admin', 
  '$2b$10$RgFG/fhCrV7gBF/4aTtc3uIVfN2cJJ.hZj0qPBHRP40eyiw4iu9eK', -- 'admin123' hashed
  'ADMIN1234',
  TRUE
)
ON CONFLICT (username) DO NOTHING;

-- Create resources entry for admin
INSERT INTO resources (user_id)
SELECT id FROM users WHERE username = 'admin'
ON CONFLICT (user_id) DO NOTHING;

-- Create user profile for admin
INSERT INTO user_profiles (user_id)
SELECT id FROM users WHERE username = 'admin'
ON CONFLICT (user_id) DO NOTHING;