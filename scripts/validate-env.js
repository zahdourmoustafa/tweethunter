#!/usr/bin/env node

/**
 * Environment validation script
 * Run this to check if all environment variables are properly configured
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🔍 Validating environment configuration...\n');

try {
  // Try to run the TypeScript environment test with proper env loading
  const result = execSync(
    'npx tsx --env-file=.env src/config/test-env.ts',
    { 
      cwd: path.resolve(__dirname, '..'),
      encoding: 'utf8',
      stdio: 'inherit'
    }
  );
  
} catch (error) {
  console.log('\n📝 Required environment variables:');
  console.log('- DATABASE_URL');
  console.log('- BETTER_AUTH_SECRET (32+ characters)');
  console.log('- BETTER_AUTH_URL');
  console.log('- TWITTER_CLIENT_ID');
  console.log('- TWITTER_CLIENT_SECRET');
  console.log('- OPENAI_API_KEY');
  console.log('- TWITTER_BEARER_TOKEN');
  console.log('\n💡 Refer to .env.example for the required format.');
  process.exit(1);
}
