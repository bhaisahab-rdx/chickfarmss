// Database utility functions for the API
import pg from 'pg';
const { Pool } = pg;

/**
 * Global pool used for database connections
 * We use a singleton pattern to ensure we only create one pool
 */
let globalPool = null;

/**
 * Create a database pool if one doesn't exist
 * @returns {pg.Pool} The database pool
 */
function getPool() {
  if (!globalPool) {
    // Get the database URL from the environment
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    
    // Create a new pool
    console.log(`Creating new database pool for ${databaseUrl.split('@')[1]}`);
    
    const poolConfig = {
      connectionString: databaseUrl,
      // Use a maximum of 10 connections for the pool
      max: 10,
      // Idle timeout of 30 seconds
      idleTimeoutMillis: 30000,
      // Connection timeout of 5 seconds
      connectionTimeoutMillis: 5000,
      // Retry for up to 5 seconds
      retryMaxDuration: 5000
    };
    
    // Check if we're running on Vercel
    if (process.env.VERCEL || process.env.VERCEL_URL) {
      console.log('Running on Vercel, using SSL for database connections');
      poolConfig.ssl = {
        rejectUnauthorized: false
      };
    }
    
    // Create the pool
    globalPool = new Pool(poolConfig);
    
    // Handle pool errors
    globalPool.on('error', (err) => {
      console.error('Unexpected database pool error', err);
    });
  }
  
  return globalPool;
}

/**
 * Get a client from the pool, with retries
 * @returns {Promise<pg.PoolClient>} A database client
 */
export async function getClient() {
  const pool = getPool();
  
  // Try to get a client from the pool
  try {
    console.log('Getting client from pool...');
    const client = await pool.connect();
    console.log('Got client from pool');
    return client;
  } catch (error) {
    console.error('Error getting client from pool:', error.message);
    throw error;
  }
}

/**
 * Execute a query with retries
 * @param {string} query - The SQL query to execute
 * @param {any[]} params - The parameters for the query
 * @param {number} maxRetries - The maximum number of retries
 * @returns {Promise<any>} The query result
 */
export async function queryWithRetry(query, params = [], maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Get a client from the pool
    let client = null;
    
    try {
      client = await getClient();
      
      // Execute the query
      console.log(`Executing query (attempt ${attempt}/${maxRetries}): ${query.substring(0, 50)}...`);
      const result = await client.query(query, params);
      return result;
    } catch (error) {
      console.error(`Query error (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Store the error
      lastError = error;
      
      // Exponential backoff: 100ms, 200ms, 400ms, ...
      const backoffDelay = 100 * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${backoffDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    } finally {
      // Always release the client
      if (client) {
        console.log('Releasing client back to pool');
        client.release();
      }
    }
  }
  
  // If we get here, all retries failed
  console.error(`Query failed after ${maxRetries} attempts`);
  throw lastError;
}

/**
 * Test the database connection
 * @returns {Promise<boolean>} True if the connection works
 */
export async function testConnection() {
  try {
    const result = await queryWithRetry('SELECT NOW() as time');
    const time = result.rows[0].time;
    console.log(`Database connection successful. Server time: ${time}`);
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error.message);
    return false;
  }
}