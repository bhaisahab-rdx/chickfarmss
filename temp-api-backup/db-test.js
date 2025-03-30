// Database test API for verifying connection
import { testConnection, queryWithRetry } from './db-utils.js';

/**
 * Handler for database test API endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default async function handler(req, res) {
  try {
    // First test the connection
    const connectionSuccessful = await testConnection();
    
    // If the connection failed, return a 500 error
    if (!connectionSuccessful) {
      return res.status(500).json({
        status: 'error',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
        database_url: process.env.DATABASE_URL ? 
          `${process.env.DATABASE_URL.split('@')[1]}` : 'Not set'
      });
    }
    
    // If the connection was successful, get some basic database info
    try {
      // Get database version
      const versionResult = await queryWithRetry('SELECT version()');
      const dbVersion = versionResult.rows[0].version;
      
      // Get connection count
      const connectionResult = await queryWithRetry(
        'SELECT count(*) as count FROM pg_stat_activity'
      );
      const connectionCount = connectionResult.rows[0].count;
      
      // Get table count
      const tableResult = await queryWithRetry(
        "SELECT count(*) as count FROM information_schema.tables WHERE table_schema = 'public'"
      );
      const tableCount = tableResult.rows[0].count;
      
      // Return success response with database info
      return res.status(200).json({
        status: 'ok',
        message: 'Database connection successful',
        timestamp: new Date().toISOString(),
        database: {
          version: dbVersion,
          connections: connectionCount,
          tables: tableCount
        }
      });
    } catch (error) {
      // If querying database info failed, return a partial success
      return res.status(206).json({
        status: 'partial',
        message: 'Database connection successful but could not get database info',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    // If an unexpected error occurred, return a 500 error
    console.error('Database test error:', error);
    
    return res.status(500).json({
      status: 'error',
      message: 'Database test failed with an unexpected error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}