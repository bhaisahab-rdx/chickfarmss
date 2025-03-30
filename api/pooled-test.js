// Pooled database test API for verifying connection pooling
import { getClient } from './db-utils.js';

/**
 * Handler for pooled database test endpoint
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default async function handler(req, res) {
  // Number of iterations to test connection pooling
  const iterations = req.query.iterations ? parseInt(req.query.iterations) : 5;
  
  // Array to store results
  const results = [];
  
  // Flag to indicate overall success
  let success = true;
  
  try {
    // Test multiple connections to verify pooling
    console.log(`Testing connection pooling with ${iterations} iterations`);
    
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        // Get client from pool
        const client = await getClient();
        
        try {
          // Execute a simple query
          const result = await client.query('SELECT NOW() as time');
          const time = result.rows[0].time;
          const elapsed = Date.now() - startTime;
          
          // Add to results
          results.push({
            iteration: i + 1,
            success: true,
            time: time,
            elapsed: `${elapsed}ms`
          });
          
          console.log(`Iteration ${i+1}/${iterations}: Success (${elapsed}ms)`);
        } finally {
          // Always release the client
          client.release();
        }
      } catch (error) {
        // Record failure
        const elapsed = Date.now() - startTime;
        results.push({
          iteration: i + 1,
          success: false,
          error: error.message,
          elapsed: `${elapsed}ms`
        });
        
        // Set success flag to false
        success = false;
        
        console.error(`Iteration ${i+1}/${iterations}: Failed (${elapsed}ms) - ${error.message}`);
      }
    }
    
    // Return results
    res.status(success ? 200 : 500).json({
      status: success ? 'ok' : 'error',
      message: success 
        ? `All ${iterations} connection attempts succeeded` 
        : `Some connection attempts failed`,
      timestamp: new Date().toISOString(),
      results: results,
      summary: {
        total: iterations,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        averageTime: Math.round(
          results.reduce((sum, r) => sum + parseInt(r.elapsed), 0) / iterations
        ) + 'ms'
      }
    });
  } catch (error) {
    // Handle unexpected errors
    console.error('Pooled connection test error:', error);
    
    res.status(500).json({
      status: 'error',
      message: 'Pooled connection test failed with an unexpected error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}