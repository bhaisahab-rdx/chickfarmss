-- ChickFarms Database Backup SQL File
-- Generated: March 16, 2025

-- Drop tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS resources;
DROP TABLE IF EXISTS chickens;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS game_settings;
DROP TABLE IF EXISTS prices;

-- Create tables
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(512) NOT NULL,
  usdt_balance DECIMAL(10, 2) DEFAULT 0,
  referral_code VARCHAR(255) UNIQUE,
  referred_by VARCHAR(255),
  is_admin BOOLEAN DEFAULT FALSE,
  last_login_at TIMESTAMP
);

CREATE TABLE chickens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  next_hatch_time TIMESTAMP
);

CREATE TABLE resources (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  water_buckets INTEGER DEFAULT 0,
  wheat_bags INTEGER DEFAULT 0,
  eggs INTEGER DEFAULT 0
);

CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  transaction_id VARCHAR(255),
  referral_commission DECIMAL(10, 2),
  bank_details TEXT
);

CREATE TABLE game_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  item_type VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  country VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP
);

-- Insert data from our backup
-- Users
INSERT INTO users (id, username, password, usdt_balance, referral_code, referred_by, is_admin, last_login_at) VALUES
(1, 'adminraja', '98d75bdbfdc150081e99b86a400c8dcf9c4fa47f9e2848fd07d3bc8f75be037b8a486565c40199caec051a07df6028ed8061a6659994024d988dba596c24850a.691ee6cd4a8529044bb1651ef0e87807', 160.00, 'ADMIN', NULL, TRUE, NULL);

-- Reset sequences for users table
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Prices
INSERT INTO prices (id, item_type, price) VALUES
(1, 'baby_chicken', 90.00),
(2, 'regular_chicken', 150.00),
(3, 'golden_chicken', 400.00),
(4, 'water_bucket', 0.50),
(5, 'wheat_bag', 0.50),
(6, 'egg', 0.10);

-- Reset sequences for prices table
SELECT setval('prices_id_seq', (SELECT MAX(id) FROM prices));

-- Game Settings
INSERT INTO game_settings (id, setting_key, setting_value, updated_at) VALUES
(1, 'withdrawal_tax', '5', '2025-03-16T14:38:55.606Z'),
(2, 'payment_address', 'TRX8nHHo2Jd7H9ZwKhh6h8h', '2025-03-16T14:38:56.075Z');

-- Reset sequences for game_settings table
SELECT setval('game_settings_id_seq', (SELECT MAX(id) FROM game_settings));

-- Insert resources
INSERT INTO resources (id, user_id, water_buckets, wheat_bags, eggs) VALUES
(1, 1, 37, 37, 7);
SELECT setval('resources_id_seq', (SELECT MAX(id) FROM resources));

-- Insert chickens
INSERT INTO chickens (id, user_id, type, next_hatch_time) VALUES
(3, 1, 'baby', '2025-03-16T18:17:58.425Z'),
(4, 1, 'regular', '2025-03-16T18:18:01.819Z');
SELECT setval('chickens_id_seq', (SELECT MAX(id) FROM chickens));

-- Insert transactions
INSERT INTO transactions (id, user_id, type, amount, status, transaction_id, referral_commission, created_at, bank_details) VALUES
(1, 1, 'recharge', 500.00, 'completed', 'foenvioevq', NULL, '2025-03-16T17:30:08.837Z', NULL),
(2, 1, 'sale', 67.50, 'pending', 'f1fa34de0cec05ea6a390b0fd962a21e', NULL, '2025-03-16T17:31:50.257Z', '{"itemType":"baby_chicken","action":"sell"}'),
(3, 1, 'sale', 112.50, 'pending', 'ff4858f340bdd66aef694b359e409e3a', NULL, '2025-03-16T17:32:05.758Z', '{"itemType":"regular_chicken","action":"sell"}');
SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

-- No additional game settings needed as they are already defined above