import fs from 'fs-extra';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

// Fix for ES modules to get __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execPromise = util.promisify(exec);

async function updateImports() {
  try {
    console.log('Updating import paths in Netlify function files...');
    
    // Get all TypeScript files in the netlify/functions/server directory
    const serverFiles = await glob('netlify/functions/server/**/*.ts');
    
    for (const file of serverFiles) {
      let content = await fs.readFile(file, 'utf8');
      
      // Replace @shared imports with relative paths
      content = content.replace(
        /from\s+["']@shared\/(.*?)["']/g, 
        'from "../shared/$1"'
      );
      
      // Save the modified file
      await fs.writeFile(file, content, 'utf8');
      console.log(`Updated imports in: ${file}`);
    }
    
    console.log('Import paths updated successfully!');
  } catch (error) {
    console.error('Failed to update import paths:', error);
    throw error;
  }
}

async function build() {
  try {
    console.log('Building client and server for production...');
    // Use the existing build command from package.json
    const buildResult = await execPromise('npm run build');
    console.log(buildResult.stdout);
    
    console.log('Copying necessary server files to netlify functions...');
    // Ensure directories exist
    await fs.ensureDir(path.resolve(__dirname, './netlify/functions/server'));
    await fs.ensureDir(path.resolve(__dirname, './netlify/functions/shared'));
    
    // Copy server and shared directories
    await fs.copy(
      path.resolve(__dirname, './server'), 
      path.resolve(__dirname, './netlify/functions/server')
    );
    await fs.copy(
      path.resolve(__dirname, './shared'), 
      path.resolve(__dirname, './netlify/functions/shared')
    );
    
    // Copy drizzle.config.ts file
    await fs.copy(
      path.resolve(__dirname, './drizzle.config.ts'), 
      path.resolve(__dirname, './netlify/functions/drizzle.config.ts')
    );
    
    // Update import paths in server files
    await updateImports();
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

build();