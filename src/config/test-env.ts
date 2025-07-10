#!/usr/bin/env tsx

/**
 * Simple test to validate environment configuration
 * This runs server-side only, so we can safely use dotenv
 */

import { config } from "dotenv";
config(); // Load .env file for testing

import { env } from './env'

export function testEnv() {
  console.log('🧪 Testing environment configuration...')
  
  // Test server environment
  console.log(`✅ Database: ${env.DATABASE_URL ? "configured" : "❌ missing"}`)
  console.log(`✅ Better Auth Secret: ${env.BETTER_AUTH_SECRET ? "configured" : "❌ missing"}`)
  console.log(`✅ OpenAI API Key: ${env.OPENAI_API_KEY ? "configured" : "❌ missing"}`)
  console.log(`✅ TwitterAPI.io Key: ${env.TWITTERAPI_IO_API_KEY ? "configured" : "❌ missing"}`)
  
  // Test client environment  
  console.log(`✅ Better Auth URL: ${env.BETTER_AUTH_URL}`)
  console.log(`✅ Twitter Client ID: ${env.TWITTER_CLIENT_ID ? "configured" : "❌ missing"}`)
  console.log(`✅ Environment: ${env.NODE_ENV}`)
  
  // Summary
  const serverConfigured = !!(env.DATABASE_URL && env.BETTER_AUTH_SECRET && env.OPENAI_API_KEY && env.TWITTERAPI_IO_API_KEY)
  const clientConfigured = !!(env.BETTER_AUTH_URL && env.TWITTER_CLIENT_ID)
  
  console.log(`\n📊 Configuration Status:`)
  console.log(`📡 Server: ${serverConfigured ? "✅ Ready" : "❌ Missing required vars"}`)
  console.log(`🌐 Client: ${clientConfigured ? "✅ Ready" : "❌ Missing required vars"}`)
  console.log(`🎯 Overall: ${serverConfigured && clientConfigured ? "✅ All systems go!" : "❌ Configuration incomplete"}`)
  
  return serverConfigured && clientConfigured
}
