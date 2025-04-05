// Database backup script
import fs from 'fs';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Extract Pool from pg (CommonJS module)
const { Pool } = pg;

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tables to backup
const tables = [
  'users',
  'chickens',
  'resources',
  'transactions',
  'game_settings',
  'prices',
  'user_profiles'
];

// Create backup directory
const backupDir = path.join(__dirname, 'database_backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Function to backup a table
async function backupTable(tableName) {
  try {
    console.log(`Backing up table: ${tableName}`);
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    const data = JSON.stringify(result.rows, null, 2);
    fs.writeFileSync(path.join(backupDir, `${tableName}.json`), data);
    console.log(`Table ${tableName} backed up successfully.`);
  } catch (error) {
    console.error(`Error backing up table ${tableName}:`, error);
  }
}

// Main backup function
async function backupDatabase() {
  try {
    console.log('Starting database backup...');
    
    // Create a backup manifest
    const manifest = {
      timestamp: new Date().toISOString(),
      tables: tables,
      version: '1.0.0'
    };
    
    // Backup each table
    for (const table of tables) {
      await backupTable(table);
    }
    
    // Write manifest
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'), 
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('Database backup completed successfully.');
  } catch (error) {
    console.error('Database backup failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the backup
backupDatabase();