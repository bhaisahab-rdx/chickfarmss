-- Database export generated on 2025-03-30T11:24:25.059Z

-- Clean start - drop tables if they exist
DROP TABLE IF EXISTS "user_mystery_boxes" CASCADE;
DROP TABLE IF EXISTS "mystery_boxes" CASCADE;
DROP TABLE IF EXISTS "spin_history" CASCADE;
DROP TABLE IF EXISTS "spin_rewards" CASCADE;
DROP TABLE IF EXISTS "referral_payments" CASCADE;
DROP TABLE IF EXISTS "game_settings" CASCADE;
DROP TABLE IF EXISTS "user_achievements" CASCADE;
DROP TABLE IF EXISTS "achievements" CASCADE;
DROP TABLE IF EXISTS "prices" CASCADE;
DROP TABLE IF EXISTS "user_profiles" CASCADE;
DROP TABLE IF EXISTS "transactions" CASCADE;
DROP TABLE IF EXISTS "chickens" CASCADE;
DROP TABLE IF EXISTS "resources" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Schema creation
CREATE TABLE "users" (
  "id" integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
  "username" text NOT NULL,
  "password" text NOT NULL,
  "usdt_balance" numeric DEFAULT '0'::numeric NOT NULL,
  "referral_code" text NOT NULL,
  "referred_by" text,
  "is_admin" boolean DEFAULT false NOT NULL,
  "last_login_at" timestamp without time zone,
  "total_referral_earnings" numeric DEFAULT '0'::numeric NOT NULL,
  "total_team_earnings" numeric DEFAULT '0'::numeric NOT NULL,
  "last_salary_paid_at" timestamp without time zone,
  "last_daily_reward_at" date,
  "current_streak" integer DEFAULT 0 NOT NULL,
  "last_spin_at" timestamp without time zone,
  "extra_spins_available" integer DEFAULT 0 NOT NULL,
  "referral_count" integer DEFAULT 0 NOT NULL,
  "telegram_id" text,
  PRIMARY KEY ("id")
);

-- Data for table users
INSERT INTO "users" ("id", "username", "password", "usdt_balance", "referral_code", "referred_by", "is_admin", "last_login_at", "total_referral_earnings", "total_team_earnings", "last_salary_paid_at", "last_daily_reward_at", "current_streak", "last_spin_at", "extra_spins_available", "referral_count", "telegram_id") VALUES (1, 'adminraja', 'df4303b2b2d29934e1f9db263559adc433f5e6332e2b2ac39a21ebf244d3b6860d41eee30afcf32841de44affef04092754c5bde5db1cf2a677dbe1729ac4cd7.99e2df640fb97f19b7593d3f44f02d1e', '0.00', 'ADMIN', NULL, true, NULL, '0.00', '0.00', NULL, NULL, 0, '"2025-03-30T07:13:27.603Z"', 0, 0, NULL);

CREATE TABLE "resources" (
  "id" integer DEFAULT nextval('resources_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "water_buckets" integer DEFAULT 0 NOT NULL,
  "wheat_bags" integer DEFAULT 0 NOT NULL,
  "eggs" integer DEFAULT 0 NOT NULL,
  "mystery_boxes" integer DEFAULT 0 NOT NULL,
  PRIMARY KEY ("id")
);

-- Data for table resources
INSERT INTO "resources" ("id", "user_id", "water_buckets", "wheat_bags", "eggs", "mystery_boxes") VALUES (1, 1, 0, 1, 0, 0);

CREATE TABLE "chickens" (
  "id" integer DEFAULT nextval('chickens_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "type" text NOT NULL,
  "last_hatch_time" timestamp without time zone,
  "status" text DEFAULT 'alive'::text,
  "created_at" timestamp without time zone DEFAULT now(),
  "death_date" timestamp without time zone,
  PRIMARY KEY ("id")
);

CREATE TABLE "transactions" (
  "id" integer DEFAULT nextval('transactions_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "type" text NOT NULL,
  "amount" numeric NOT NULL,
  "status" text NOT NULL,
  "transaction_id" text,
  "referral_commission" numeric,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  "bank_details" text,
  PRIMARY KEY ("id")
);

-- Data for table transactions
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (1, 1, 'recharge', '10.00', 'pending', 'TEST-1743020915068-1', NULL, '"2025-03-26T20:28:35.189Z"', '{"paymentMethod":"test_payment","status":"pending"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (2, 1, 'recharge', '10.00', 'pending', 'TEST-1743020966133-1', NULL, '"2025-03-26T20:29:26.252Z"', '{"paymentMethod":"test_payment","status":"pending"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (3, 1, 'recharge', '10.00', 'pending', 'TEST-1743021219412-1', NULL, '"2025-03-26T20:33:39.532Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (4, 1, 'recharge', '10.00', 'pending', 'TEST-1743021282157-1', NULL, '"2025-03-26T20:34:42.275Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (5, 1, 'recharge', '10.00', 'pending', 'TEST-1743021561459-1', NULL, '"2025-03-26T20:39:22.968Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (6, 1, 'recharge', '10.00', 'pending', 'TEST-1743021566273-1', NULL, '"2025-03-26T20:39:26.390Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (7, 1, 'recharge', '10.00', 'pending', 'TEST-1743021884170-1', NULL, '"2025-03-26T20:44:44.290Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (8, 1, 'recharge', '107.00', 'pending', 'TEST-1743056692036-1', NULL, '"2025-03-27T06:24:52.155Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (9, 1, 'recharge', '10.00', 'pending', 'TEST-1743057258946-1', NULL, '"2025-03-27T06:34:19.063Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (10, 1, 'recharge', '10.00', 'pending', 'TEST-1743060036671-1', NULL, '"2025-03-27T07:20:36.788Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (11, 1, 'recharge', '103.00', 'pending', 'TEST-1743060193254-1', NULL, '"2025-03-27T07:23:13.373Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (12, 1, 'recharge', '10.00', 'pending', 'a1e3fb5ffd7ea888a4770e400c8eadf2', NULL, '"2025-03-27T07:23:17.284Z"', '{"method":"nowpayments_popup"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (13, 1, 'recharge', '10.00', 'pending', 'TEST-1743193581094-1', NULL, '"2025-03-28T20:26:21.210Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (14, 1, 'recharge', '10.00', 'pending', '84eb89a23dc5b09ac12a0be8fd24fe65', NULL, '"2025-03-28T20:27:51.980Z"', '{"method":"nowpayments_popup"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (15, 1, 'recharge', '10.00', 'pending', 'TEST-1743193762328-1', NULL, '"2025-03-28T20:29:22.442Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (16, 1, 'recharge', '10.00', 'pending', 'TEST-1743194268882-1', NULL, '"2025-03-28T20:37:48.997Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (17, 1, 'recharge', '104.00', 'pending', 'TEST-1743194740531-1', NULL, '"2025-03-28T20:45:40.648Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (18, 1, 'recharge', '10.00', 'pending', '43c9997cceb0b82b7d15dd271fde36cb', NULL, '"2025-03-28T21:04:32.518Z"', '{"method":"nowpayments_popup"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (19, 1, 'recharge', '10.00', 'pending', 'TEST-1743196470275-1', NULL, '"2025-03-28T21:14:30.392Z"', '{"invoiceDetails":{"status":false,"statusCode":403,"code":"INVALID_API_KEY","message":"Invalid api key"},"paymentMethod":"nowpayments_invoice"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (20, 1, 'recharge', '10.00', 'pending', 'TEST-1743197028216-1', NULL, '"2025-03-28T21:23:48.332Z"', '{"status":"pending","paymentMethod":"nowpayments_direct_fallback"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (21, 1, 'recharge', '103.00', 'pending', 'TEST-1743197450570-1', NULL, '"2025-03-28T21:30:50.684Z"', '{"status":"pending","paymentMethod":"nowpayments_direct_fallback"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (22, 1, 'recharge', '10.00', 'pending', 'TEST-1743197753046-1', NULL, '"2025-03-28T21:35:53.164Z"', '{"status":"pending","paymentMethod":"nowpayments_direct_fallback"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (23, 1, 'recharge', '10.00', 'pending', 'TEST-1743198197044-1', NULL, '"2025-03-28T21:43:17.163Z"', '{"status":"pending","paymentMethod":"nowpayments_direct_fallback"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (24, 1, 'recharge', '10.00', 'pending', '168243cb2c54c1c90a96f062ecff30b3', NULL, '"2025-03-28T22:09:06.087Z"', '{"paymentMethod":"nowpayments_direct"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (25, 1, 'deposit', '109.00', 'pending', '5909444212', '0.00', '"2025-03-29T09:13:55.170Z"', '{"payment_id":"5909444212","payment_status":"waiting","pay_address":"","price_amount":"109","price_currency":"USD","pay_amount":0,"pay_currency":"USDTTRC20","order_id":"user_1_1743239634731","order_description":"ChickFarms USDT deposit","ipn_callback_url":"http://localhost:5000/api/ipn/nowpayments","created_at":"2025-03-29T09:13:54.827Z","updated_at":"2025-03-29T09:13:54.827Z","purchase_id":"5909444212","payment_url":"https://nowpayments.io/payment/?iid=5909444212","invoice_id":"5909444212"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (26, 1, 'deposit', '10.00', 'pending', '5700771514', '0.00', '"2025-03-29T09:16:56.734Z"', '{"payment_id":"5700771514","payment_status":"waiting","pay_address":"","price_amount":"10","price_currency":"USD","pay_amount":0,"pay_currency":"USDTTRC20","order_id":"user_1_1743239816350","order_description":"ChickFarms USDT deposit","ipn_callback_url":"http://localhost:5000/api/ipn/nowpayments","created_at":"2025-03-29T09:16:56.424Z","updated_at":"2025-03-29T09:16:56.424Z","purchase_id":"5700771514","payment_url":"https://nowpayments.io/payment/?iid=5700771514","invoice_id":"5700771514"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (27, 1, 'deposit', '10.00', 'pending', '6082237762', '0.00', '"2025-03-29T09:24:55.623Z"', '{"payment_id":"6082237762","payment_status":"waiting","pay_address":"","price_amount":"10","price_currency":"USD","pay_amount":0,"pay_currency":"USDTTRC20","order_id":"user_1_1743240295233","order_description":"ChickFarms USDT deposit","ipn_callback_url":"http://localhost:5000/api/ipn/nowpayments","created_at":"2025-03-29T09:24:55.309Z","updated_at":"2025-03-29T09:24:55.309Z","purchase_id":"6082237762","payment_url":"https://nowpayments.io/payment/?iid=6082237762","invoice_id":"6082237762"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (28, 1, 'deposit', '10.00', 'rejected', '6047960835', '0.00', '"2025-03-29T09:30:45.882Z"', '{"payment_id":"6047960835","payment_status":"waiting","pay_address":"","price_amount":"10","price_currency":"USD","pay_amount":0,"pay_currency":"USDTTRC20","order_id":"user_1_1743240645489","order_description":"ChickFarms USDT deposit","ipn_callback_url":"http://localhost:5000/api/ipn/nowpayments","created_at":"2025-03-29T09:30:45.562Z","updated_at":"2025-03-29T09:30:45.562Z","purchase_id":"6047960835","payment_url":"https://nowpayments.io/payment/?iid=6047960835","invoice_id":"6047960835"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (31, 1, 'recharge', '10.00', 'pending', '6272444113', NULL, '"2025-03-29T09:41:36.799Z"', '{"method":"nowpayments","paymentId":"6272444113"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (32, 1, 'recharge', '190.00', 'pending', '6347277572', NULL, '"2025-03-29T09:42:19.777Z"', '{"method":"nowpayments","paymentId":"6347277572"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (33, 1, 'recharge', '10.00', 'pending', '6235812773', NULL, '"2025-03-29T09:43:02.256Z"', '{"method":"nowpayments","paymentId":"6235812773"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (34, 1, 'recharge', '101.00', 'pending', '5650839146', NULL, '"2025-03-29T10:26:41.042Z"', '{"method":"nowpayments","paymentId":"5650839146"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (35, 1, 'recharge', '10.00', 'pending', '4935884307', NULL, '"2025-03-29T20:26:20.770Z"', '{"method":"nowpayments","paymentId":"4935884307"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (36, 1, 'recharge', '10.00', 'pending', '4690657283', NULL, '"2025-03-29T20:34:58.707Z"', '{"method":"nowpayments","paymentId":"4690657283"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (37, 1, 'recharge', '10.00', 'pending', '5902284329', NULL, '"2025-03-29T20:39:19.247Z"', '{"method":"nowpayments","paymentId":"5902284329"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (38, 1, 'recharge', '10.00', 'pending', '4885762052', NULL, '"2025-03-30T08:46:36.910Z"', '{"method":"nowpayments","paymentId":"4885762052"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (29, 1, 'deposit', '10.00', 'rejected', '4418291221', '0.00', '"2025-03-29T09:32:25.339Z"', '{"payment_id":"4418291221","payment_status":"waiting","pay_address":"","price_amount":"10","price_currency":"USD","pay_amount":0,"pay_currency":"USDTTRC20","order_id":"user_1_1743240745064","order_description":"ChickFarms USDT deposit","ipn_callback_url":"http://localhost:5000/api/ipn/nowpayments","created_at":"2025-03-29T09:32:25.152Z","updated_at":"2025-03-29T09:32:25.152Z","purchase_id":"4418291221","payment_url":"https://nowpayments.io/payment/?iid=4418291221","invoice_id":"4418291221"}');
INSERT INTO "transactions" ("id", "user_id", "type", "amount", "status", "transaction_id", "referral_commission", "created_at", "bank_details") VALUES (30, 1, 'deposit', '10.00', 'rejected', '5166264228', '0.00', '"2025-03-29T09:36:46.472Z"', '{"payment_id":"5166264228","payment_status":"waiting","pay_address":"","price_amount":"10","price_currency":"USD","pay_amount":0,"pay_currency":"USDTTRC20","order_id":"user_1_1743241006077","order_description":"ChickFarms USDT deposit","ipn_callback_url":"http://localhost:5000/api/ipn/nowpayments","created_at":"2025-03-29T09:36:46.157Z","updated_at":"2025-03-29T09:36:46.157Z","purchase_id":"5166264228","payment_url":"https://nowpayments.io/payment/?iid=5166264228","invoice_id":"5166264228"}');

CREATE TABLE "user_profiles" (
  "id" integer DEFAULT nextval('user_profiles_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "farm_name" text,
  "avatar_color" text DEFAULT '#6366F1'::text,
  "avatar_style" text DEFAULT 'default'::text,
  "farm_background" text DEFAULT 'default'::text,
  "tutorial_completed" boolean DEFAULT false NOT NULL,
  "tutorial_step" integer DEFAULT 0 NOT NULL,
  "tutorial_disabled" boolean DEFAULT false NOT NULL,
  "last_updated" timestamp without time zone DEFAULT now() NOT NULL,
  "displayed_badge_id" integer,
  PRIMARY KEY ("id")
);

CREATE TABLE "prices" (
  "id" integer DEFAULT nextval('prices_id_seq'::regclass) NOT NULL,
  "item_type" text NOT NULL,
  "price" numeric NOT NULL,
  PRIMARY KEY ("id")
);

-- Data for table prices
INSERT INTO "prices" ("id", "item_type", "price") VALUES (1, 'baby_chicken', '90.00');
INSERT INTO "prices" ("id", "item_type", "price") VALUES (2, 'regular_chicken', '150.00');
INSERT INTO "prices" ("id", "item_type", "price") VALUES (3, 'golden_chicken', '400.00');
INSERT INTO "prices" ("id", "item_type", "price") VALUES (4, 'water_bucket', '0.50');
INSERT INTO "prices" ("id", "item_type", "price") VALUES (5, 'wheat_bag', '0.50');
INSERT INTO "prices" ("id", "item_type", "price") VALUES (6, 'egg', '0.10');
INSERT INTO "prices" ("id", "item_type", "price") VALUES (7, 'mystery_box', '50.00');

CREATE TABLE "user_achievements" (
  "id" integer DEFAULT nextval('user_achievements_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "badge_id" integer NOT NULL,
  "unlocked_at" timestamp without time zone DEFAULT now() NOT NULL,
  "progress" integer DEFAULT 0 NOT NULL,
  "is_complete" boolean DEFAULT false NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "game_settings" (
  "id" integer DEFAULT nextval('game_settings_id_seq'::regclass) NOT NULL,
  "setting_key" text NOT NULL,
  "setting_value" text NOT NULL,
  "updated_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);

-- Data for table game_settings
INSERT INTO "game_settings" ("id", "setting_key", "setting_value", "updated_at") VALUES (1, 'withdrawal_tax', '5', '"2025-03-26T20:28:01.456Z"');
INSERT INTO "game_settings" ("id", "setting_key", "setting_value", "updated_at") VALUES (2, 'payment_address', 'TRX8nHHo2Jd7H9ZwKhh6h8h', '"2025-03-26T20:28:01.930Z"');

CREATE TABLE "spin_rewards" (
  "id" integer DEFAULT nextval('spin_rewards_id_seq'::regclass) NOT NULL,
  "spinType" character varying(255) NOT NULL,
  "rewardType" character varying(255) NOT NULL,
  "amount" numeric NOT NULL,
  "chickenType" character varying(255),
  "probability" numeric NOT NULL,
  "created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp without time zone,
  PRIMARY KEY ("id")
);

-- Data for table spin_rewards
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (1, 'daily', 'eggs', '5.00', NULL, '25.0000', '"2025-03-30T10:51:23.593Z"', '"2025-03-30T10:51:23.593Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (2, 'daily', 'eggs', '10.00', NULL, '20.0000', '"2025-03-30T10:51:23.830Z"', '"2025-03-30T10:51:23.830Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (3, 'daily', 'eggs', '15.00', NULL, '15.0000', '"2025-03-30T10:51:24.063Z"', '"2025-03-30T10:51:24.063Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (4, 'daily', 'wheat', '5.00', NULL, '15.0000', '"2025-03-30T10:51:24.296Z"', '"2025-03-30T10:51:24.296Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (5, 'daily', 'water', '5.00', NULL, '15.0000', '"2025-03-30T10:51:24.529Z"', '"2025-03-30T10:51:24.529Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (6, 'daily', 'extra_spin', '1.00', NULL, '5.0000', '"2025-03-30T10:51:24.762Z"', '"2025-03-30T10:51:24.762Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (7, 'daily', 'usdt', '0.50', NULL, '4.0000', '"2025-03-30T10:51:24.994Z"', '"2025-03-30T10:51:24.994Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (8, 'daily', 'usdt', '1.00', NULL, '1.0000', '"2025-03-30T10:51:25.227Z"', '"2025-03-30T10:51:25.227Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (9, 'super', 'eggs', '50.00', NULL, '30.0000', '"2025-03-30T10:51:25.460Z"', '"2025-03-30T10:51:25.460Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (10, 'super', 'eggs', '100.00', NULL, '20.0000', '"2025-03-30T10:51:25.692Z"', '"2025-03-30T10:51:25.692Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (11, 'super', 'eggs', '200.00', NULL, '15.0000', '"2025-03-30T10:51:25.924Z"', '"2025-03-30T10:51:25.924Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (12, 'super', 'usdt', '5.00', NULL, '10.0000', '"2025-03-30T10:51:26.157Z"', '"2025-03-30T10:51:26.157Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (13, 'super', 'chicken', '1.00', 'regular', '10.0000', '"2025-03-30T10:51:26.389Z"', '"2025-03-30T10:51:26.389Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (14, 'super', 'chicken', '1.00', 'golden', '5.0000', '"2025-03-30T10:51:26.621Z"', '"2025-03-30T10:51:26.621Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (15, 'super', 'usdt', '25.00', NULL, '3.0000', '"2025-03-30T10:51:26.853Z"', '"2025-03-30T10:51:26.853Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (16, 'super', 'usdt', '50.00', NULL, '2.0000', '"2025-03-30T10:51:27.085Z"', '"2025-03-30T10:51:27.085Z"');
INSERT INTO "spin_rewards" ("id", "spinType", "rewardType", "amount", "chickenType", "probability", "created_at", "updated_at") VALUES (17, 'super', 'chicken', '1.00', 'golden', '1.0000', '"2025-03-30T10:51:27.317Z"', '"2025-03-30T10:51:27.318Z"');

CREATE TABLE "spin_history" (
  "id" integer DEFAULT nextval('spin_history_id_seq'::regclass) NOT NULL,
  "user_id" integer NOT NULL,
  "spin_type" text NOT NULL,
  "reward_type" text NOT NULL,
  "reward_amount" numeric NOT NULL,
  "chicken_type" text,
  "created_at" timestamp without time zone DEFAULT now() NOT NULL,
  PRIMARY KEY ("id")
);

-- Data for table spin_history
INSERT INTO "spin_history" ("id", "user_id", "spin_type", "reward_type", "reward_amount", "chicken_type", "created_at") VALUES (1, 1, 'daily', 'wheat', '1.00', NULL, '"2025-03-30T07:13:27.014Z"');

