// Export database to SQL file
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function exportDatabaseToSql() {
  return new Promise((resolve, reject) => {
    console.log('Starting SQL database export...');
    
    // Get database URL from environment
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      return reject(new Error('DATABASE_URL environment variable is not set'));
    }
    
    // File to save the SQL dump
    const outputFile = path.join(__dirname, 'chickfarms_backup.sql');
    const outputStream = fs.createWriteStream(outputFile);
    
    // Use pg_dump to create an SQL export
    const pgDump = spawn('pg_dump', [dbUrl]);
    
    pgDump.stdout.pipe(outputStream);
    
    pgDump.stderr.on('data', (data) => {
      console.error(`pg_dump error: ${data}`);
    });
    
    pgDump.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ SQL export completed successfully: ${outputFile}`);
        resolve(outputFile);
      } else {
        reject(new Error(`pg_dump process exited with code ${code}`));
      }
    });
  });
}

// Run the export
exportDatabaseToSql()
  .then(filePath => {
    console.log(`Database exported to ${filePath}`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Export failed:', error);
    process.exit(1);
  });