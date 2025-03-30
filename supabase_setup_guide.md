# Supabase Setup Guide for ChickFarms (Updated March 2025)

This guide will help you set up a Supabase database for your ChickFarms application and migrate from your existing PostgreSQL database.

## Steps to Create and Configure Supabase

1. Create a Supabase account at https://supabase.com/
2. Create a new project
3. Name your project "chickfarms" (or your preferred name)
4. Choose a strong database password
5. Select the region closest to your users (for lowest latency)
6. Wait for your database to be provisioned (usually takes 2-3 minutes)

## Database Connection String

Once your database is created, get the connection string:

1. Go to Project Settings > Database
2. Find the "Connection string" section
3. Choose "URI" format
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your database password

## Setting Up Environment Variables

1. Go to your deployed environment (Vercel, Netlify, or other platform)
2. Add the following environment variables:

```
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_IPN_SECRET_KEY=your_nowpayments_ipn_secret_key
SESSION_SECRET=a_strong_random_string_for_session_encryption
```

## Database Schema Migration

You have two options to migrate your database:

### Option 1: Using the Schema Push Command

```bash
# This will create all tables based on your Drizzle schema
npm run db:push
```

### Option 2: Direct SQL Import (Recommended for existing data)

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the SQL schema from `databasenewextract.sql` 
3. Execute the SQL to create all tables and import existing data

## Tables Overview

The ChickFarms database includes the following tables:

- `users`: User accounts and authentication
- `chickens`: Player's chicken collection
- `resources`: Player's in-game resources (water, wheat, eggs)
- `transactions`: Payment history
- `prices`: Game item pricing
- `spin_history`: Record of daily spins
- `referral_earnings`: Multi-level referral commissions
- `mystery_box_rewards`: Loot box rewards
- `milestone_rewards`: Team milestone tracking
- `achievement_badges`: Achievement system

## Security Configuration

1. Configure proper Row Level Security (RLS) policies:

```sql
-- Example RLS policy for the users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_select ON users 
    FOR SELECT USING (auth.uid() = id OR auth.jwt() ? 'is_admin');
```

2. Set up authentication to work with your frontend:

- Configure social providers if needed (Google, Facebook, etc.)
- Set up email templates for verification
- Configure password policies

## Monitoring and Maintenance

- Enable database backups (daily recommended)
- Set up database health monitoring
- Consider enabling Supabase's logging for API calls

## Verifying Your Setup

After migration, check that your database is working properly:

1. Verify all tables exist with the correct structure
2. Test login functionality
3. Verify game mechanics work (chicken hatching, resource gathering)
4. Test payment processing
5. Test referral system

## Troubleshooting

- If you encounter connection issues, verify your IP is allowed in Supabase settings
- For payment processing issues, check NOWPayments API key configuration
- For session issues, verify the SESSION_SECRET is properly configured
- If you see database errors, check the Supabase logs for detailed information