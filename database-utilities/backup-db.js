// Simple database backup script
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './server/db.js';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Tables to backup
const TABLES = [
  'users',
  'user_profiles',
  'resources',
  'chickens',
  'transactions',
  'game_settings',
  'prices'
];

// Create backup directory if it doesn't exist
const backupDir = path.join(__dirname, 'database_backup');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

async function backupTable(tableName) {
  console.log(`Backing up table: ${tableName}`);
  
  try {
    // Query all data from the table
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    
    // Write to JSON file
    const filePath = path.join(backupDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
    
    console.log(`✅ Successfully backed up ${result.rows.length} rows from ${tableName}`);
    return {
      table: tableName,
      count: result.rows.length,
      success: true
    };
  } catch (error) {
    console.error(`❌ Error backing up ${tableName}:`, error.message);
    return {
      table: tableName,
      success: false,
      error: error.message
    };
  }
}

async function runBackup() {
  console.log('Starting database backup...');
  
  // Create manifest file with timestamp
  const manifest = {
    timestamp: new Date().toISOString(),
    tables: [],
    completed: false
  };
  
  try {
    // Back up each table
    for (const table of TABLES) {
      const result = await backupTable(table);
      manifest.tables.push(result);
    }
    
    manifest.completed = true;
    
    // Write manifest
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
    
    console.log('✅ Database backup completed successfully');
  } catch (error) {
    console.error('❌ Backup process failed:', error);
    
    // Write failed manifest
    manifest.error = error.message;
    fs.writeFileSync(
      path.join(backupDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2)
    );
  } finally {
    // Close the database connection
    await pool.end();
  }
}

// Run the backup
runBackup();