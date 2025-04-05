-- Database schema export for ChickFarms
-- Generated on March 16, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    usdt_balance DECIMAL(10,2) NOT NULL DEFAULT 0,
    referral_code TEXT NOT NULL UNIQUE,
    referred_by TEXT,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMP
);

-- Chickens table
CREATE TABLE IF NOT EXISTS chickens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    last_hatch_time TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Resources table
CREATE TABLE IF NOT EXISTS resources (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    water_buckets INTEGER NOT NULL DEFAULT 0,
    wheat_bags INTEGER NOT NULL DEFAULT 0,
    eggs INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT NOT NULL,
    transaction_id TEXT,
    referral_commission DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    bank_details TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Game settings table
CREATE TABLE IF NOT EXISTS game_settings (
    id SERIAL PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
    id SERIAL PRIMARY KEY,
    item_type TEXT NOT NULL UNIQUE,
    price DECIMAL(10,2) NOT NULL
);

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    farm_name TEXT,
    avatar_color TEXT DEFAULT '#6366F1',
    avatar_style TEXT DEFAULT 'default',
    farm_background TEXT DEFAULT 'default',
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Default data insertions

-- Insert admin user
INSERT INTO users (username, password, usdt_balance, referral_code, is_admin)
VALUES ('adminraja', '$2b$10$HxICyqrJzYD6j8kzwFjiPOYVjGv.h9zqXBlTqaX5gZXKK4kx4f8Hy', 0, 'ADMIN', true)
ON CONFLICT (username) DO NOTHING;

-- Insert default game settings
INSERT INTO game_settings (setting_key, setting_value)
VALUES 
    ('withdrawal_tax', '5'),
    ('payment_address', 'TRX8nHHo2Jd7H9ZwKhh6h8h')
ON CONFLICT (setting_key) DO NOTHING;

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_chickens_user_id ON chickens(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON resources(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
