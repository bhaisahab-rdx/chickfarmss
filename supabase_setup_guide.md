# Setting Up Your ChickFarms Database on Supabase

## Step 1: Create a Supabase Account and Project

1. Go to [Supabase](https://supabase.com/) and sign up for an account if you don't have one
2. Log in to your Supabase dashboard
3. Click the "New Project" button
4. Enter a name for your project (e.g., "ChickFarms")
5. Set a secure database password (save this password somewhere safe)
6. Choose a region closest to your target audience
7. Click "Create new project"

## Step 2: Run the Database Setup Script

1. Wait for your project to initialize (this might take a few minutes)
2. Once your project is ready, navigate to the "SQL Editor" in the left sidebar
3. Click "New Query" to create a new SQL query
4. Copy the entire contents of the `supabase_setup.sql` file and paste it into the SQL editor
5. Click "Run" to execute the script

The script will:
- Create all necessary tables
- Set up foreign key constraints
- Add appropriate indexes
- Insert default game settings
- Create an admin user

## Step 3: Get Your Database Connection Details

1. In the Supabase dashboard, navigate to "Settings" (gear icon) in the left sidebar
2. Click on "Database" from the submenu
3. Find the "Connection string" section
4. Copy the "URI" value - this is your `DATABASE_URL` environment variable

It should look something like:
```
postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-ID].supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with the database password you set when creating the project.

## Step 4: Configure Your Application

1. Add the `DATABASE_URL` to your Vercel environment variables as described earlier
2. Your application will automatically connect to the Supabase PostgreSQL database

## Step 5: Verify the Setup

1. In the Supabase dashboard, go to "Table Editor" in the left sidebar
2. You should see all the tables listed there
3. Click on the "users" table to verify that the admin user was created
4. Check other tables to make sure they were created with the correct structure

## Important Security Notes

1. The admin password in the setup script is "admin123" - **change this immediately** by updating the password hash
2. Make sure to use proper environment management for your database credentials
3. Do not commit the database password to your version control system
4. Enable Row Level Security in Supabase for additional protection if needed

## Backup and Maintenance

1. Supabase provides automatic daily backups (available on paid plans)
2. You can create manual backups from the "Database" settings page
3. Monitor your database usage to avoid hitting limits on the free tier

## Troubleshooting

If you encounter issues with the database setup:

1. Check the error messages in the SQL Editor
2. Ensure your Supabase project is fully initialized
3. If tables already exist, you may need to drop them first or remove the conflicting constraints
4. Verify that your application has the correct database connection string