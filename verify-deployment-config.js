/**
 * Vercel Deployment Configuration Verification Script
 * 
 * This script checks your project setup for Vercel deployment compatibility
 * and runs basic tests to verify that deployment will work correctly.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Console colors for better readability
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Log a message with a specified status color
 */
function log(message, status = 'info') {
  const statusColors = {
    success: colors.green,
    error: colors.red,
    warning: colors.yellow,
    info: colors.blue,
    title: colors.cyan,
    subtle: colors.gray
  };
  
  console.log(`${statusColors[status] || ''}${message}${colors.reset}`);
}

/**
 * Main verification function
 */
async function verifyDeploymentConfig() {
  log('\n=== ChickFarms Vercel Deployment Verification ===\n', 'title');
  
  // Track issues found during verification
  const issues = [];
  
  // Check 1: Verify that required files exist
  log('Checking required files...', 'info');
  const requiredFiles = [
    { path: 'vercel.json', desc: 'Vercel configuration file' },
    { path: 'api/test-deployment.js', desc: 'API test endpoint' },
    { path: 'api/health.js', desc: 'Health check API' },
    { path: 'api/minimal.js', desc: 'Minimal API test' },
    { path: 'public/health.html', desc: 'Static health check page' },
    { path: 'index.html', desc: 'Root redirection file' }
  ];
  
  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(__dirname, file.path))) {
      log(`  ✓ ${file.desc} (${file.path}) found`, 'success');
    } else {
      log(`  ✗ ${file.desc} (${file.path}) not found`, 'error');
      issues.push(`Missing ${file.desc} (${file.path})`);
    }
  }
  
  // Check 2: Verify vercel.json configuration
  log('\nChecking vercel.json configuration...', 'info');
  let vercelConfig;
  try {
    const vercelConfigPath = path.join(__dirname, 'vercel.json');
    const configContent = fs.readFileSync(vercelConfigPath, 'utf8');
    vercelConfig = JSON.parse(configContent);
    
    // Check for builds configuration
    if (vercelConfig.builds && Array.isArray(vercelConfig.builds)) {
      log(`  ✓ Found ${vercelConfig.builds.length} build configurations`, 'success');
      
      // Check for API builds
      const apiBuild = vercelConfig.builds.find(b => b.src && b.src.includes('api'));
      if (apiBuild) {
        log(`  ✓ API build configuration found (${apiBuild.src})`, 'success');
      } else {
        log(`  ✗ API build configuration not found`, 'error');
        issues.push('Missing API build configuration in vercel.json');
      }
      
      // Check for static builds
      const staticBuild = vercelConfig.builds.find(b => 
        (b.src && b.src.includes('public')) || 
        (b.src && b.src.includes('dist'))
      );
      if (staticBuild) {
        log(`  ✓ Static build configuration found (${staticBuild.src})`, 'success');
      } else {
        log(`  ✗ Static build configuration not found`, 'warning');
        issues.push('Missing or unclear static build configuration in vercel.json');
      }
    } else {
      log('  ✗ No builds configuration found in vercel.json', 'error');
      issues.push('Missing builds configuration in vercel.json');
    }
    
    // Check routes configuration
    if (vercelConfig.routes && Array.isArray(vercelConfig.routes)) {
      log(`  ✓ Found ${vercelConfig.routes.length} route configurations`, 'success');
      
      // Check for API routes
      const apiRoute = vercelConfig.routes.find(r => r.src && r.src.includes('/api'));
      if (apiRoute) {
        log(`  ✓ API route configuration found (${apiRoute.src} -> ${apiRoute.dest})`, 'success');
      } else {
        log(`  ✗ API route configuration not found`, 'error');
        issues.push('Missing API route configuration in vercel.json');
      }
      
      // Check for root path route
      const rootRoute = vercelConfig.routes.find(r => r.src === '^/$' || r.src === '/');
      if (rootRoute) {
        log(`  ✓ Root route configuration found (${rootRoute.src} -> ${rootRoute.dest})`, 'success');
      } else {
        log(`  ✗ Root route configuration not found`, 'warning');
        issues.push('Missing root route configuration in vercel.json');
      }
      
      // Check for catchall route
      const catchallRoute = vercelConfig.routes.find(r => 
        r.src && (r.src.includes('(.*)') || r.src.includes('/*'))
      );
      if (catchallRoute) {
        log(`  ✓ Catchall route configuration found (${catchallRoute.src})`, 'success');
      } else {
        log(`  ✗ Catchall route configuration not found`, 'warning');
        issues.push('Missing catchall route in vercel.json');
      }
    } else if (vercelConfig.rewrites) {
      log(`  ✓ Found ${vercelConfig.rewrites.length} rewrite configurations (using rewrites instead of routes)`, 'success');
      log(`  ⚠ Note: build-vercel.js will convert rewrites to routes`, 'warning');
    } else {
      log('  ✗ No routes or rewrites configuration found in vercel.json', 'error');
      issues.push('Missing routes/rewrites configuration in vercel.json');
    }
    
    // Check for incompatible configuration
    if (vercelConfig.routes && vercelConfig.headers) {
      log('  ✗ Both routes and headers found in vercel.json (incompatible in Vercel)', 'error');
      issues.push('Incompatible combination of routes and headers in vercel.json');
    }
    
    // Check for environment variables
    if (vercelConfig.env) {
      log(`  ✓ Environment variables configuration found in vercel.json`, 'success');
    } else {
      log('  ⚠ No environment variables found in vercel.json', 'warning');
      log('    (This is OK if you set them in the Vercel dashboard)', 'subtle');
    }
    
  } catch (error) {
    log(`  ✗ Error parsing vercel.json: ${error.message}`, 'error');
    issues.push(`Error in vercel.json: ${error.message}`);
  }
  
  // Check 3: Verify build scripts
  log('\nChecking build scripts...', 'info');
  const buildScripts = [
    { name: 'build-vercel.js', desc: 'Main Vercel build script' },
    { name: 'vercel-api-build.js', desc: 'API-specific build script' }
  ];
  
  for (const script of buildScripts) {
    const scriptPath = path.join(__dirname, script.name);
    if (fs.existsSync(scriptPath)) {
      log(`  ✓ ${script.desc} (${script.name}) found`, 'success');
      
      // Check script content
      const content = fs.readFileSync(scriptPath, 'utf8');
      if (content.includes('validateVercelConfig')) {
        log(`  ✓ ${script.name} includes config validation`, 'success');
      } else if (script.name === 'build-vercel.js') {
        log(`  ⚠ ${script.name} doesn't seem to include config validation`, 'warning');
        issues.push(`${script.name} may be missing config validation logic`);
      }
    } else {
      log(`  ✗ ${script.desc} (${script.name}) not found`, 'error');
      issues.push(`Missing ${script.desc} (${script.name})`);
    }
  }
  
  // Check 4: Verify test-deployment.js
  log('\nChecking test-deployment.js functionality...', 'info');
  const testDeploymentPath = path.join(__dirname, 'api', 'test-deployment.js');
  if (fs.existsSync(testDeploymentPath)) {
    const content = fs.readFileSync(testDeploymentPath, 'utf8');
    
    // Check for database schema validation
    if (content.includes('requiredTablesMapping')) {
      log(`  ✓ test-deployment.js includes flexible schema validation with requiredTablesMapping`, 'success');
    } else if (content.includes('referral_earnings')) {
      log(`  ✓ test-deployment.js references referral_earnings table`, 'success');
    } else if (content.includes('requiredTables') && !content.includes('referral_earnings')) {
      log(`  ⚠ test-deployment.js might be using rigid schema validation`, 'warning');
      issues.push(`test-deployment.js may not handle alternate table names correctly`);
    }
    
    // Check for comprehensive tests
    const testChecks = [
      { term: 'Database connectivity', found: content.includes('Database connectivity') },
      { term: 'API connectivity', found: content.includes('API connectivity') },
      { term: 'Environment variables', found: content.includes('Environment variables') },
      { term: 'Database schema', found: content.includes('Database schema') },
      { term: 'NOWPayments', found: content.includes('NOWPayments') }
    ];
    
    for (const check of testChecks) {
      if (check.found) {
        log(`  ✓ test-deployment.js includes ${check.term} check`, 'success');
      } else {
        log(`  ⚠ test-deployment.js might be missing ${check.term} check`, 'warning');
        issues.push(`test-deployment.js may be missing ${check.term} check`);
      }
    }
  } else {
    log(`  ✗ test-deployment.js not found`, 'error');
    issues.push(`Missing test-deployment.js file`);
  }
  
  // Check 5: Verify .env file presence and structure
  log('\nChecking environment variables...', 'info');
  const envFiles = [
    { path: '.env.production', desc: 'Production environment variables' },
    { path: '.env', desc: 'Local environment variables' }
  ];
  
  let foundEnvFile = false;
  for (const envFile of envFiles) {
    const envPath = path.join(__dirname, envFile.path);
    if (fs.existsSync(envPath)) {
      foundEnvFile = true;
      log(`  ✓ ${envFile.desc} (${envFile.path}) found`, 'success');
      
      // Check content without exposing sensitive values
      const content = fs.readFileSync(envPath, 'utf8');
      const requiredVars = [
        'NODE_ENV',
        'DATABASE_URL',
        'SESSION_SECRET',
        'NOWPAYMENTS_API_KEY',
        'NOWPAYMENTS_IPN_SECRET_KEY'
      ];
      
      for (const varName of requiredVars) {
        if (content.includes(`${varName}=`)) {
          log(`  ✓ ${envFile.path} contains ${varName}`, 'success');
        } else {
          log(`  ⚠ ${envFile.path} doesn't contain ${varName}`, 'warning');
          issues.push(`${envFile.path} is missing ${varName}`);
        }
      }
    }
  }
  
  if (!foundEnvFile) {
    log('  ⚠ No environment variable files found', 'warning');
    log('    (This is OK if you set them in the Vercel dashboard)', 'subtle');
    issues.push('No environment variable files found');
  }
  
  // Check 6: Run test-deployment.js in the test environment
  log('\nTesting test-deployment.js in NODE_ENV=production...', 'info');
  try {
    // Set production environment temporarily
    process.env.NODE_ENV = 'production';
    
    // Run the test using dedicated test script
    const testCmd = 'node test-api-deployment.js';
    log(`  Running: ${testCmd}`, 'subtle');
    
    try {
      const { stdout } = await execAsync(testCmd, { env: { ...process.env, NODE_ENV: 'production' } });
      
      // Look for the test results summary section in the output
      const summaryMatch = stdout.match(/===== Test Results Summary =====\s+Status: (\w+)\s+Environment: (\w+)\s+Tests: (\d+) passed, (\d+) failed/);
      
      if (summaryMatch) {
        const [_, status, env, passed, failed] = summaryMatch;
        
        if (status === 'SUCCESS') {
          log(`  ✓ test-deployment.js executed successfully`, 'success');
          log(`  ✓ All tests passed: ${passed} tests in ${env} environment`, 'success');
        } else {
          log(`  ⚠ test-deployment.js reported failures`, 'warning');
          log(`  ⚠ Tests: ${passed} passed, ${failed} failed in ${env} environment`, 'warning');
          issues.push(`Some tests failed during API verification`);
        }
        
        // Try to extract any failed tests from JSON output
        try {
          // Find a JSON object in the output
          const jsonMatch = stdout.match(/\{[\s\S]*"tests"[\s\S]*\}/);
          if (jsonMatch) {
            const testResults = JSON.parse(jsonMatch[0]);
            
            // Log failed tests if any
            const failedTests = testResults.tests.filter(t => t.status === 'failed');
            if (failedTests.length > 0) {
              failedTests.forEach(test => {
                log(`    - ${test.name}: ${test.message}`, 'warning');
                issues.push(`Test '${test.name}' failed: ${test.message}`);
              });
            }
          }
        } catch (jsonError) {
          // If we can't parse the JSON, we already have the summary, so just continue
          log(`  ℹ Could not parse detailed test results`, 'subtle');
        }
      } else {
        // No summary found, try to parse the entire output as JSON
        try {
          // Find the last JSON object in the output
          const jsonMatches = [...stdout.matchAll(/(\{[\s\S]*"success"[\s\S]*\})/g)];
          if (jsonMatches.length > 0) {
            const testResults = JSON.parse(jsonMatches[jsonMatches.length - 1][0]);
            
            if (testResults.success) {
              log(`  ✓ test-deployment.js executed successfully`, 'success');
              log(`  ✓ All tests passed: ${testResults.summary.passed}/${testResults.summary.total}`, 'success');
            } else {
              log(`  ⚠ test-deployment.js reported failures`, 'warning');
              log(`  ⚠ Tests: ${testResults.summary.passed} passed, ${testResults.summary.failed} failed`, 'warning');
              
              // Log failed tests
              testResults.tests.filter(t => t.status === 'failed').forEach(test => {
                log(`    - ${test.name}: ${test.message}`, 'warning');
                issues.push(`Test '${test.name}' failed: ${test.message}`);
              });
            }
          } else {
            log(`  ⚠ Could not find test results summary in output`, 'warning');
            issues.push(`Could not parse test-deployment.js output`);
          }
        } catch (parseError) {
          log(`  ⚠ Test ran but could not parse results: ${parseError.message}`, 'warning');
          issues.push(`Error parsing test-deployment.js output: ${parseError.message}`);
        }
      }
    } catch (error) {
      log(`  ✗ Error executing test-api-deployment.js: ${error.message}`, 'error');
      issues.push(`Error executing test-api-deployment.js: ${error.message}`);
      
      if (error.stdout) {
        // Try to extract any information from the output
        const summaryMatch = error.stdout.match(/===== Test Results Summary =====\s+Status: (\w+)\s+Environment: (\w+)\s+Tests: (\d+) passed, (\d+) failed/);
        
        if (summaryMatch) {
          const [_, status, env, passed, failed] = summaryMatch;
          log(`  ⚠ Tests ran but had failures: ${passed} passed, ${failed} failed`, 'warning');
        } else {
          log(`  ✗ Test execution failed with output: ${error.stdout.substring(0, 200)}...`, 'error');
        }
      }
    }
  } catch (execError) {
    log(`  ✗ Failed to execute test: ${execError.message}`, 'error');
    issues.push(`Failed to execute test: ${execError.message}`);
  }
  
  // Final summary
  log('\n=== Verification Summary ===\n', 'title');
  
  if (issues.length === 0) {
    log('Congratulations! Your deployment configuration looks good. 🎉', 'success');
    log('You should be ready to deploy to Vercel.', 'success');
  } else {
    log(`Found ${issues.length} potential issues that need attention:`, 'warning');
    issues.forEach((issue, index) => {
      log(`${index + 1}. ${issue}`, 'warning');
    });
    
    log('\nRecommendations:', 'info');
    log('1. Fix the issues listed above', 'info');
    log('2. Run this verification script again', 'info');
    log('3. Run the build scripts before deploying:', 'info');
    log('   $ node build-vercel.js && node vercel-api-build.js', 'subtle');
  }
  
  // Deployment reminder
  log('\nTo deploy to Vercel, run:', 'info');
  log('$ vercel --prod', 'subtle');
  log('\nOr deploy via the Vercel dashboard, setting these environment variables:', 'info');
  log('- NODE_ENV=production', 'subtle');
  log('- DATABASE_URL=postgresql://username:password@host:port/database', 'subtle');
  log('- SESSION_SECRET=your_session_secret', 'subtle');
  log('- NOWPAYMENTS_API_KEY=your_api_key', 'subtle');
  log('- NOWPAYMENTS_IPN_SECRET_KEY=your_ipn_secret_key', 'subtle');
}

// Run the verification
verifyDeploymentConfig().catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});