// Script to export the latest database schema and data
const { Pool } = require('pg');
const fs = require('fs');
// Use DATABASE_URL from environment directly

const dbUrl = process.env.DATABASE_URL;

// Tables to export
const tables = [
  'users',
  'resources',
  'chickens',
  'transactions',
  'user_profiles',
  'prices',
  'achievements',
  'user_achievements',
  'game_settings',
  'referral_payments',
  'spin_rewards',
  'spin_history',
  'mystery_boxes',
  'user_mystery_boxes'
];

async function exportDatabaseToSql() {
  const pool = new Pool({
    connectionString: dbUrl,
  });

  try {
    console.log('Connected to the database');
    
    let sqlOutput = `-- Database export generated on ${new Date().toISOString()}\n\n`;
    
    // Add a clean start section - drop tables if they exist
    sqlOutput += `-- Clean start - drop tables if they exist\n`;
    for (const table of [...tables].reverse()) {
      sqlOutput += `DROP TABLE IF EXISTS "${table}" CASCADE;\n`;
    }
    
    // Add sequences for tables with serial IDs
    sqlOutput += `\n-- Sequences creation\n`;
    for (const table of tables) {
      sqlOutput += `CREATE SEQUENCE IF NOT EXISTS ${table}_id_seq;\n`;
    }
    sqlOutput += `\n-- Schema creation\n`;
    
    // Export schema for each table
    for (const table of tables) {
      console.log(`Exporting schema for table: ${table}`);
      
      // Get table schema
      const schemaResult = await pool.query(`
        SELECT 
          column_name, 
          data_type, 
          character_maximum_length,
          column_default, 
          is_nullable
        FROM 
          information_schema.columns 
        WHERE 
          table_name = $1
        ORDER BY 
          ordinal_position
      `, [table]);
      
      if (schemaResult.rows.length === 0) {
        console.log(`Table ${table} does not exist, skipping...`);
        continue;
      }
      
      // Get primary key information
      const pkResult = await pool.query(`
        SELECT 
          c.column_name
        FROM 
          information_schema.table_constraints tc,
          information_schema.constraint_column_usage c
        WHERE 
          tc.constraint_type = 'PRIMARY KEY'
          AND tc.table_name = $1
          AND tc.constraint_name = c.constraint_name
      `, [table]);
      
      const primaryKeys = pkResult.rows.map(row => row.column_name);
      
      // Generate CREATE TABLE statement
      sqlOutput += `CREATE TABLE "${table}" (\n`;
      
      const columns = schemaResult.rows.map(row => {
        let columnDef = `  "${row.column_name}" ${row.data_type}`;
        
        if (row.character_maximum_length) {
          columnDef += `(${row.character_maximum_length})`;
        }
        
        if (row.column_default) {
          columnDef += ` DEFAULT ${row.column_default}`;
        }
        
        if (row.is_nullable === 'NO') {
          columnDef += ' NOT NULL';
        }
        
        return columnDef;
      });
      
      // Add primary key constraint if exists
      if (primaryKeys.length > 0) {
        columns.push(`  PRIMARY KEY (${primaryKeys.map(pk => `"${pk}"`).join(', ')})`);
      }
      
      sqlOutput += columns.join(',\n');
      sqlOutput += `\n);\n\n`;
      
      // Export data
      console.log(`Exporting data for table: ${table}`);
      const dataResult = await pool.query(`SELECT * FROM "${table}"`);
      
      if (dataResult.rows.length > 0) {
        sqlOutput += `-- Data for table ${table}\n`;
        
        for (const row of dataResult.rows) {
          const columns = Object.keys(row).map(key => `"${key}"`).join(', ');
          const values = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          }).join(', ');
          
          sqlOutput += `INSERT INTO "${table}" (${columns}) VALUES (${values});\n`;
        }
        
        sqlOutput += `\n`;
      }
    }
    
    // Write SQL to file
    fs.writeFileSync('databasenewextract.sql', sqlOutput);
    console.log('Database export completed successfully!');
    console.log('File saved as: databasenewextract.sql');
    
  } catch (error) {
    console.error('Error exporting database:', error);
  } finally {
    await pool.end();
  }
}

// Execute the export
exportDatabaseToSql();