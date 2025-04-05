// Database restore script for migrating to Supabase
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Create a connection to the new database (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Tables to restore - ensure correct order for foreign key dependencies
const TABLES = [
  'users',
  'user_profiles',
  'resources',
  'chickens',
  'transactions',
  'game_settings',
  'prices'
];

// Path to backup directory
const backupDir = path.join(__dirname, 'database_backup');

async function restoreDatabase() {
  console.log('Starting database restoration...');
  
  try {
    // First verify we can connect to the database
    const client = await pool.connect();
    console.log('✅ Connected to database');
    client.release();
    
    // Check if we have the manifest file
    const manifestPath = path.join(backupDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Manifest file not found. Run backup-db.js first.');
    }
    
    // Read the manifest
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log(`Found backup from: ${manifest.timestamp}`);
    
    // Process each table
    for (const table of TABLES) {
      await restoreTable(table);
    }
    
    console.log('✅ Database restoration completed successfully');
  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

async function restoreTable(tableName) {
  console.log(`Restoring table: ${tableName}`);
  
  try {
    // Get the backup file path
    const filePath = path.join(backupDir, `${tableName}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Backup file for ${tableName} not found`);
    }
    
    // Read the data
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (data.length === 0) {
      console.log(`Table ${tableName} is empty, skipping`);
      return;
    }
    
    // Start a transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Delete existing data
      await client.query(`DELETE FROM ${tableName}`);
      
      // Get the columns from the first row
      const columns = Object.keys(data[0]);
      
      // Generate values placeholders
      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const values = columns.map(col => row[col]);
        
        // Create parameterized query to prevent SQL injection
        const placeholders = values.map((_, idx) => `$${idx + 1}`).join(', ');
        const query = `
          INSERT INTO ${tableName} (${columns.join(', ')}) 
          VALUES (${placeholders})
        `;
        
        await client.query(query, values);
      }
      
      // If there's a sequence for ID, reset it
      if (columns.includes('id')) {
        const seqName = `${tableName}_id_seq`;
        const maxId = Math.max(...data.map(row => Number(row.id)));
        
        try {
          await client.query(`SELECT setval('${seqName}', ${maxId}, true)`);
        } catch (error) {
          // Sequence might not exist, which is fine
          console.log(`Note: Could not reset sequence for ${tableName}`);
        }
      }
      
      await client.query('COMMIT');
      console.log(`✅ Restored ${data.length} rows to ${tableName}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(`❌ Error restoring ${tableName}:`, error.message);
    throw error;
  }
}

// Run the restoration
restoreDatabase();