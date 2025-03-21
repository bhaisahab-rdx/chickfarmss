import fs from 'fs-extra';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);

async function build() {
  try {
    console.log('Building client and server for production...');
    // Use the existing build command from package.json
    await execPromise('npm run build');
    
    console.log('Copying necessary server files to netlify functions...');
    // Ensure directories exist
    await fs.ensureDir('./netlify/functions/server');
    await fs.ensureDir('./netlify/functions/shared');
    
    // Copy server and shared directories
    await fs.copy('./server', './netlify/functions/server');
    await fs.copy('./shared', './netlify/functions/shared');
    
    // Copy drizzle.config.ts file
    await fs.copy('./drizzle.config.ts', './netlify/functions/drizzle.config.ts');
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();