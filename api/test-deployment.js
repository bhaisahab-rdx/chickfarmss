/**
 * Comprehensive API test endpoint for Vercel deployment
 * Tests all critical system components and API endpoints
 */

import { testConnection, queryWithRetry } from './db-utils.js';
import os from 'os';

/**
 * Handler for API test endpoint 
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
export default async function handler(req, res) {
  const results = {
    timestamp: new Date().toISOString(),
    deployment: 'vercel',
    success: true,
    environment: process.env.NODE_ENV || 'unknown',
    systemInfo: {
      platform: process.platform,
      nodeVersion: process.version,
      hostname: os.hostname(),
      memory: {
        totalMb: Math.round(os.totalmem() / 1024 / 1024),
        freeMb: Math.round(os.freemem() / 1024 / 1024),
        usagePercent: Math.round((1 - os.freemem() / os.totalmem()) * 100)
      },
      cpus: os.cpus().length
    },
    tests: []
  };

  try {
    // Test 1: Basic connectivity
    results.tests.push({
      name: 'API connectivity',
      status: 'passed',
      message: 'API endpoint is accessible'
    });

    // Test 2: Environment variables
    const requiredEnvVars = ['DATABASE_URL', 'NODE_ENV'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length === 0) {
      results.tests.push({
        name: 'Environment variables',
        status: 'passed',
        message: 'All required environment variables are present'
      });
    } else {
      results.success = false;
      results.tests.push({
        name: 'Environment variables',
        status: 'failed',
        message: `Missing environment variables: ${missingVars.join(', ')}`
      });
    }

    // Test 3: Database connectivity
    try {
      const dbConnected = await testConnection();
      
      if (dbConnected) {
        results.tests.push({
          name: 'Database connectivity',
          status: 'passed',
          message: 'Successfully connected to the database'
        });
        
        // Test 4: Database query
        try {
          const queryResult = await queryWithRetry('SELECT NOW() as server_time');
          results.tests.push({
            name: 'Database query',
            status: 'passed',
            message: `Database query successful. Server time: ${queryResult.rows[0].server_time}`
          });
        } catch (queryError) {
          results.success = false;
          results.tests.push({
            name: 'Database query',
            status: 'failed',
            message: `Database query failed: ${queryError.message}`,
            error: queryError.stack
          });
        }
      } else {
        results.success = false;
        results.tests.push({
          name: 'Database connectivity',
          status: 'failed',
          message: 'Failed to connect to the database'
        });
      }
    } catch (dbError) {
      results.success = false;
      results.tests.push({
        name: 'Database connectivity',
        status: 'failed',
        message: `Database connection error: ${dbError.message}`,
        error: dbError.stack
      });
    }

    // Test 5: Nowpayments API key
    if (process.env.NOWPAYMENTS_API_KEY) {
      results.tests.push({
        name: 'NOWPayments configuration',
        status: 'passed',
        message: 'NOWPayments API key is configured'
      });
    } else {
      results.success = false;
      results.tests.push({
        name: 'NOWPayments configuration',
        status: 'warning',
        message: 'NOWPayments API key is not configured, payment processing will not work'
      });
    }

    // Test 6: Check Database Tables
    try {
      const tableResult = await queryWithRetry(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tables = tableResult.rows.map(row => row.table_name);
      
      // Map required tables to actual table names (in case of naming differences)
      const requiredTablesMapping = {
        'users': 'users',
        'chickens': 'chickens',
        'transactions': 'transactions',
        'referrals': ['referrals', 'referral_earnings']  // Accept either referrals or referral_earnings
      };
      
      // Check if each required entity exists in the database
      const missingTables = [];
      for (const [requiredName, actualNames] of Object.entries(requiredTablesMapping)) {
        const actualNamesArray = Array.isArray(actualNames) ? actualNames : [actualNames];
        // If none of the possible table names for this entity exist, mark it as missing
        if (!actualNamesArray.some(name => tables.includes(name))) {
          missingTables.push(requiredName);
        }
      }
      
      if (missingTables.length === 0) {
        results.tests.push({
          name: 'Database schema',
          status: 'passed',
          message: `Found ${tables.length} tables: ${tables.join(', ')}`
        });
      } else {
        results.success = false;
        results.tests.push({
          name: 'Database schema',
          status: 'failed',
          message: `Missing required tables: ${missingTables.join(', ')}`,
          details: {
            foundTables: tables,
            requiredTables: Object.keys(requiredTablesMapping)
          }
        });
      }
    } catch (tableError) {
      results.success = false;
      results.tests.push({
        name: 'Database schema',
        status: 'failed',
        message: `Failed to check database tables: ${tableError.message}`,
        error: tableError.stack
      });
    }

  } catch (error) {
    results.success = false;
    results.error = {
      message: error.message,
      stack: error.stack
    };
  }

  // Add overall summary
  results.summary = {
    total: results.tests.length,
    passed: results.tests.filter(t => t.status === 'passed').length,
    failed: results.tests.filter(t => t.status === 'failed').length,
    warnings: results.tests.filter(t => t.status === 'warning').length
  };

  // Send appropriate status code based on test results
  const statusCode = results.success ? 200 : 500;
  res.status(statusCode).json(results);
  
  // For command-line execution, print results to stdout if not in an express context
  if (!res.headersSent && typeof process !== 'undefined') {
    console.log(JSON.stringify(results, null, 2));
  }
}