# Supabase Setup Guide for ChickFarms

This guide walks you through setting up a Supabase project for ChickFarms.

## 1. Create a Supabase Account

If you don't already have one, sign up at [https://supabase.com](https://supabase.com).

## 2. Create a New Project

1. Log in to your Supabase account
2. Click "New Project"
3. Fill in the details:
   - Name: `ChickFarms` (or your preferred name)
   - Database Password: Create a strong password
   - Region: Choose the closest to your users
   - Pricing Plan: Start with the free plan

## 3. Get Database Connection Details

1. Once your project is created, go to Project Settings > Database
2. Under "Connection String", find the connection string that looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
   ```
3. Copy this string and save it for later use

## 4. Setup Database Schema

We'll use Drizzle to push the schema to Supabase:

```bash
# Save the Supabase connection string as DATABASE_URL
export DATABASE_URL="your_supabase_connection_string"

# Push the schema to Supabase
npm run db:push
```

## 5. Migrate Data

Use the backup and restore scripts to migrate your data:

```bash
# First, create a backup of your current data
node backup-db.js

# Then restore this data to Supabase
DATABASE_URL="your_supabase_connection_string" node restore_database.js
```

## 6. Setup Environment Variables

Create a `.env.production` file with the following variables:

```
DATABASE_URL=your_supabase_connection_string
NOWPAYMENTS_API_KEY=your_nowpayments_api_key
NOWPAYMENTS_EMAIL=your_nowpayments_email
NOWPAYMENTS_PASSWORD=your_nowpayments_password
IPN_SECRET_KEY=your_ipn_secret_key
```

## 7. Test Connection

To verify your connection to Supabase, run:

```bash
# Using the Supabase connection string
DATABASE_URL="your_supabase_connection_string" node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Connected to Supabase!', res.rows[0]);
  }
  pool.end();
});"
```

## 8. Database Security

By default, Supabase tables have Row Level Security (RLS) enabled. For our API-based access pattern, we need to:

1. Go to Authentication > Settings
2. Under "API Access", ensure JWT settings are properly configured
3. Go to the SQL Editor and run:

```sql
-- Disable RLS for tables that will be accessed via API
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE resources DISABLE ROW LEVEL SECURITY;
ALTER TABLE chickens DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE prices DISABLE ROW LEVEL SECURITY;
```

## 9. Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase TypeScript Client](https://supabase.com/docs/reference/javascript/installing)
- [Supabase PostgreSQL Features](https://supabase.com/docs/guides/database/overview)