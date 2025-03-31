/**
 * Database Backup Script for Render Deployment
 * 
 * This script creates a backup of your ChickFarms database for Render deployment.
 * It exports all tables and their data to an SQL file that can be imported on Render.
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { fileURLToPath } from 'url';

// Load environment variables
config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the backup file path
const backupFilePath = path.join(__dirname, 'render-database-backup.sql');

// Create a PostgreSQL client
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Function to escape a string for SQL
function escapeSQLString(str) {
  if (str === null) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Function to format a value for SQL insert
function formatValueForSQL(value) {
  if (value === null) return 'NULL';
  if (value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Array.isArray(value)) return `'{${value.map(v => escapeSQLString(String(v))).join(',')}}'`;
  if (typeof value === 'object') return escapeSQLString(JSON.stringify(value));
  return escapeSQLString(String(value));
}

// Function to backup a table
async function backupTable(tableName) {
  const client = await pool.connect();
  try {
    console.log(`Backing up table: ${tableName}`);
    
    // Get table structure
    const tableStructureQuery = `
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position;
    `;
    const { rows: columns } = await client.query(tableStructureQuery, [tableName]);
    
    if (columns.length === 0) {
      console.warn(`Table ${tableName} not found or has no columns.`);
      return '';
    }
    
    // Get table data
    const { rows: data } = await client.query(`SELECT * FROM "${tableName}";`);
    
    // Generate SQL for recreating the table (optional)
    // For simplicity, we're not including constraints, indices, etc.
    
    // Generate INSERT statements
    let insertStatements = '';
    if (data.length > 0) {
      const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
      
      data.forEach(row => {
        const values = columns.map(col => formatValueForSQL(row[col.column_name])).join(', ');
        insertStatements += `INSERT INTO "${tableName}" (${columnNames}) VALUES (${values});\n`;
      });
    }
    
    return insertStatements;
  } catch (error) {
    console.error(`Error backing up table ${tableName}:`, error);
    return '';
  } finally {
    client.release();
  }
}

// Main function
async function backupDatabase() {
  try {
    console.log('Starting database backup for Render deployment...');
    
    // Get all table names
    const client = await pool.connect();
    const { rows: tables } = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE';
    `);
    client.release();
    
    // Open the backup file for writing
    const fileStream = fs.createWriteStream(backupFilePath);
    
    // Write header
    fileStream.write('-- ChickFarms Database Backup for Render Deployment\n');
    fileStream.write(`-- Generated on ${new Date().toISOString()}\n\n`);
    
    // Write a transaction start
    fileStream.write('BEGIN;\n\n');
    
    // Process each table
    for (const table of tables) {
      const tableName = table.table_name;
      const tableBackup = await backupTable(tableName);
      fileStream.write(`-- Table: ${tableName}\n`);
      fileStream.write(tableBackup);
      fileStream.write('\n');
    }
    
    // Write a transaction end
    fileStream.write('COMMIT;\n');
    
    // Close the file
    fileStream.end();
    
    console.log(`Database backup completed successfully. Backup saved to: ${backupFilePath}`);
    console.log('You can use this file to restore your database on Render.');
  } catch (error) {
    console.error('Error backing up database:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the backup
backupDatabase();