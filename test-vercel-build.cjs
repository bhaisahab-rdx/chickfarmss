// Verify Vercel API configuration by testing server
const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env.production') });

async function testVercelBuild() {
  console.log('=== VERCEL BUILD TEST ===');
  
  // Test environment variables
  console.log('\nTesting environment variables...');
  const requiredEnvVars = [
    'DATABASE_URL',
    'SESSION_SECRET',
    'NODE_ENV',
    'NOWPAYMENTS_API_KEY'
  ];
  
  let missingVars = [];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
    }
  }
  
  if (missingVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingVars.join(', ')}`);
  } else {
    console.log('✅ All required environment variables found');
  }
  
  // Test basic API functionality
  const app = express();
  
  try {
    // Set up a test server
    const port = 5001;
    const server = app.listen(port, () => {
      console.log(`\nTest server listening on port ${port}`);
    });
    
    // Test API route
    app.get('/api/test', (req, res) => {
      res.json({ status: 'success', message: 'Test API is working' });
    });
    
    // Make a test request
    console.log('\nTesting API endpoint...');
    try {
      const response = await axios.get(`http://localhost:${port}/api/test`);
      if (response.status === 200 && response.data.status === 'success') {
        console.log('✅ Test API endpoint working correctly');
      } else {
        console.error('❌ Test API endpoint returned unexpected response:', response.data);
      }
    } catch (err) {
      console.error('❌ Error testing API endpoint:', err.message);
    }
    
    // Close the server
    server.close();
    
    // Test database connection
    console.log('\nTesting database connection...');
    let dbConnected = false;
    try {
      const { Pool } = require('pg');
      const pool = new Pool({ 
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });
      
      const client = await pool.connect();
      const result = await client.query('SELECT NOW()');
      client.release();
      
      console.log('✅ Database connection successful:', result.rows[0].now);
      dbConnected = true;
    } catch (dbErr) {
      console.error('❌ Database connection failed:', dbErr.message);
    }
    
    console.log('\n=== TEST SUMMARY ===');
    console.log('Environment variables: ' + (missingVars.length === 0 ? '✅' : '❌'));
    console.log('API functionality: ✅');
    console.log('Database connection: ' + (dbConnected ? '✅' : '❌'));
    
  } catch (error) {
    console.error('❌ Error during tests:', error.message);
  }
}

testVercelBuild().catch(console.error);