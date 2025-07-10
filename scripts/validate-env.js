#!/usr/bin/env node

// Validate environment variables before starting the application
const { config } = require('dotenv');

// Load environment variables
config();

console.log('🔍 Validating environment variables...\n');

const requiredServerVars = [
  'DATABASE_URL',
  'BETTER_AUTH_SECRET',
  'TWITTER_CLIENT_ID',
  'TWITTER_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'TWITTERAPI_IO_API_KEY'
];

const requiredClientVars = [
  'NEXT_PUBLIC_BETTER_AUTH_URL',
  'NEXT_PUBLIC_TWITTER_CLIENT_ID'
];

console.log('📡 Server Environment Variables:');
const missingServerVars = [];
requiredServerVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`❌ ${varName} - MISSING`);
    missingServerVars.push(varName);
  }
});

console.log('\n🌐 Client Environment Variables:');
const missingClientVars = [];
requiredClientVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}`);
  } else {
    console.log(`❌ ${varName} - MISSING`);
    missingClientVars.push(varName);
  }
});

// Check BETTER_AUTH_SECRET length
if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
  console.log('\n❌ BETTER_AUTH_SECRET must be at least 32 characters long');
  missingServerVars.push('BETTER_AUTH_SECRET (length)');
}

console.log('\n📊 Validation Summary:');
if (missingServerVars.length === 0 && missingClientVars.length === 0) {
  console.log('🎉 All required environment variables are present!');
  process.exit(0);
} else {
  console.log('❌ Missing required environment variables:');
  [...missingServerVars, ...missingClientVars].forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n💡 Please add these to your .env.local file');
  process.exit(1);
}
