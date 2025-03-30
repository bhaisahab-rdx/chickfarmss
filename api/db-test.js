// Database connection test endpoint for Vercel troubleshooting
const { Pool } = require('pg');

module.exports = async (req, res) => {
  // Track timing for connection attempts
  const startTime = Date.now();
  let pool = null;
  let client = null;
  
  try {
    // Send initial response header to prevent timeout
    res.setHeader('Content-Type', 'application/json');
    
    // Basic environment check
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({
        status: 'error',
        message: 'DATABASE_URL environment variable is not set',
        timestamp: new Date().toISOString(),
      });
    }
    
    // Create a pool with explicit timeout settings
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      connectionTimeoutMillis: 5000, // 5 second timeout
      statement_timeout: 10000, // 10 second query timeout
      query_timeout: 10000, // 10 second query timeout
      max: 1, // Only need one connection for this test
      ssl: { rejectUnauthorized: false }, // Accept self-signed certs
    });
    
    // Log connection attempt
    console.log(`[${new Date().toISOString()}] Attempting to connect to database...`);
    
    // Try to connect
    client = await pool.connect();
    
    // Test the connection with a simple query
    const result = await client.query('SELECT current_timestamp as server_time, current_database() as db_name');
    const connectionTime = Date.now() - startTime;
    
    // Log success
    console.log(`[${new Date().toISOString()}] Database connection successful (${connectionTime}ms)`);
    
    // Return success
    return res.status(200).json({
      status: 'success',
      message: 'Database connection successful',
      connectionTime: `${connectionTime}ms`,
      dbInfo: {
        serverTime: result.rows[0].server_time,
        database: result.rows[0].db_name,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorTime = Date.now() - startTime;
    
    // Log the error
    console.error(`[${new Date().toISOString()}] Database connection failed (${errorTime}ms):`, error.message);
    
    // Return detailed error information
    return res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      errorCode: error.code,
      errorTime: `${errorTime}ms`,
      databaseUrl: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 15)}...` : 'Not set',
      timestamp: new Date().toISOString(),
    });
  } finally {
    // Clean up resources
    if (client) {
      try {
        client.release();
      } catch (e) {
        console.error('Error releasing client:', e.message);
      }
    }
    if (pool) {
      try {
        await pool.end();
      } catch (e) {
        console.error('Error ending pool:', e.message);
      }
    }
  }
};