# Database Backup and Migration Guide for ChickFarms

This guide provides instructions for backing up, restoring, and migrating your ChickFarms database.

## Backup Procedures

### Method 1: Using the Backup Script

ChickFarms includes a built-in backup script that exports each table's data to JSON files:

```bash
# Run the backup script
node backup_database.js
```

This will create JSON files for each table in the `database_backup` directory.

### Method 2: SQL Dump Export

For a complete SQL backup that includes schema and data:

```bash
# Run the SQL export script
node export-db-sql.js database_backup.sql
```

This will create a SQL file containing the complete database that can be imported into any PostgreSQL instance.

## Database Restoration

### Method 1: Restoring from JSON Backup

```bash
# Run the restore script
node restore_database.js
```

This will import data from the JSON files in the `database_backup` directory.

### Method 2: Restoring from SQL Dump

To restore from a SQL dump file:

```bash
# Using psql command line (local)
psql -U postgres -d your_database_name -f database_backup.sql

# For remote databases (like Supabase)
psql postgresql://postgres:password@db.project-id.supabase.co:5432/postgres -f database_backup.sql
```

## Database Migration

When migrating to a new database provider (e.g., from local PostgreSQL to Supabase):

### Option 1: Schema and Data Migration

1. Export your existing database to SQL:
   ```bash
   node export-db-sql.js migration.sql
   ```

2. Create a new database in your target provider

3. Import the SQL dump to the new database:
   ```bash
   # For Supabase
   psql postgresql://postgres:password@db.project-id.supabase.co:5432/postgres -f migration.sql
   ```

4. Update the `DATABASE_URL` environment variable in your deployment to point to the new database

### Option 2: Schema-Only Migration with Drizzle

If you want to create a fresh database with just the schema:

1. Update your `DATABASE_URL` to point to the new database

2. Run the schema push command:
   ```bash
   npm run db:push
   ```

3. If you need to import specific data, you can use the JSON backup files and modify the restore script to target the new database.

## Regular Backup Strategy

For production environments, implement a regular backup strategy:

1. Set up a daily scheduled backup:
   ```bash
   # Example cron job (runs at 2 AM daily)
   0 2 * * * cd /path/to/chickfarms && node export-db-sql.js "backups/chickfarms_$(date +\%Y\%m\%d).sql"
   ```

2. Regularly test your backup restoration process

3. Consider implementing off-site storage for backups:
   ```bash
   # Example: Copy the latest backup to a secure storage location
   scp backups/latest.sql user@backup-server:/secure-storage/
   ```

## Database Schema Changes

When you need to modify the database schema:

1. Update the Drizzle schema in `shared/schema.ts`

2. Run the migration command:
   ```bash
   npm run db:push
   ```

3. If data loss warnings appear, carefully review the warnings and decide whether to proceed or modify your migration approach.

## Troubleshooting Database Issues

### Common Issues and Solutions

1. **Connection Problems**:
   - Verify the `DATABASE_URL` is correct
   - Check if the database server is accessible from your application server
   - Ensure the database user has appropriate permissions

2. **Migration Failures**:
   - Check for data type incompatibilities
   - Review the error messages in detail
   - Consider using a more gradual migration approach for complex changes

3. **Performance Issues**:
   - Check for missing indexes on frequently queried columns
   - Look for slow-running queries in the database logs
   - Consider implementing caching for frequently accessed data

## Database Maintenance

Regular maintenance tasks to keep your database healthy:

1. **Vacuum and Analyze**:
   ```sql
   VACUUM ANALYZE;
   ```

2. **Index Maintenance**:
   ```sql
   REINDEX DATABASE your_database_name;
   ```

3. **Database Statistics Update**:
   ```sql
   ANALYZE;
   ```

Remember to always test backup and restoration procedures regularly to ensure your data is protected!