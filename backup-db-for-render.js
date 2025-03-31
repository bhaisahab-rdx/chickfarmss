/**
 * Database Backup Script for Render Deployment
 * 
 * This script creates a backup of your ChickFarms database for Render deployment.
 * It exports all tables and their data to an SQL file that can be imported on Render.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputFile = path.join(__dirname, 'render-database-backup.sql');

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Escape a string for SQL
 */
function escapeSQLString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Format a value for SQL based on its type
 */
function formatValueForSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  
  if (Array.isArray(value)) {
    // Handle array values
    const escapedValues = value.map(v => {
      if (typeof v === 'string') return escapeSQLString(v);
      return v;
    }).join(',');
    return `ARRAY[${escapedValues}]`;
  }
  
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  
  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }
  
  if (typeof value === 'number') {
    return value;
  }
  
  // Default to string
  return escapeSQLString(value);
}

/**
 * Backup a specific table to SQL
 */
async function backupTable(tableName) {
  console.log(`Backing up table: ${tableName}`);
  
  // Get table schema
  const schemaQuery = `
    SELECT column_name, data_type, column_default, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `;
  
  const { rows: columns } = await pool.query(schemaQuery, [tableName]);
  
  // Get table data
  const dataQuery = `SELECT * FROM "${tableName}"`;
  const { rows: data } = await pool.query(dataQuery);
  
  // Generate SQL for schema (we'll skip this and rely on Drizzle to create the schema)
  
  // Generate SQL for data
  let sql = '';
  
  if (data.length > 0) {
    const columnNames = columns.map(col => `"${col.column_name}"`).join(', ');
    
    sql += `-- Data for table ${tableName}\n`;
    sql += `INSERT INTO "${tableName}" (${columnNames}) VALUES\n`;
    
    const rows = data.map(row => {
      const values = columns.map(col => {
        return formatValueForSQL(row[col.column_name]);
      }).join(', ');
      
      return `(${values})`;
    }).join(',\n');
    
    sql += rows + ';\n\n';
  }
  
  return sql;
}

/**
 * Backup the entire database
 */
async function backupDatabase() {
  try {
    console.log('Starting database backup for Render deployment...');
    
    // Get a list of all tables
    const { rows } = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      AND table_name != 'pg_stat_statements'
      AND table_name != 'schema_migrations'
      ORDER BY table_name
    `);
    
    const tables = rows.map(row => row.table_name);
    console.log(`Found ${tables.length} tables to backup`);
    
    // Start the SQL file with some header information
    let sql = `-- ChickFarms Database Backup for Render Deployment\n`;
    sql += `-- Created: ${new Date().toISOString()}\n\n`;
    
    // Add a transaction block
    sql += 'BEGIN;\n\n';
    
    // Process each table
    for (const table of tables) {
      const tableSql = await backupTable(table);
      sql += tableSql;
    }
    
    // Close transaction
    sql += 'COMMIT;\n';
    
    // Write to file
    fs.writeFileSync(outputFile, sql);
    
    console.log(`Backup completed successfully! File saved to: ${outputFile}`);
    console.log('You can now import this file to your Render PostgreSQL database.');
    
  } catch (error) {
    console.error('Error during backup:', error);
  } finally {
    await pool.end();
  }
}

// Run the backup
backupDatabase();