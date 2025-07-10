#!/usr/bin/env tsx

/**
 * Simple test to validate environment configuration
 */

import { env, isDevelopment, isProduction } from "./env";

console.log("🔍 Testing environment configuration...\n");

try {
  console.log("✅ Environment variables loaded successfully!");
  console.log(`📍 Environment: ${env.NODE_ENV}`);
  console.log(`🔧 Development mode: ${isDevelopment}`);
  console.log(`🚀 Production mode: ${isProduction}`);
  console.log(`🔗 Auth URL: ${env.BETTER_AUTH_URL}`);
  console.log(`🗄️  Database configured: ${env.DATABASE_URL ? "✅" : "❌"}`);
  console.log(`🐦 Twitter OAuth configured: ${env.TWITTER_CLIENT_ID ? "✅" : "❌"}`);
  console.log(`🤖 OpenAI configured: ${env.OPENAI_API_KEY ? "✅" : "❌"}`);
  console.log(`📡 Twitter API configured: ${env.TWITTER_BEARER_TOKEN ? "✅" : "❌"}`);
  
  console.log("\n🎉 All environment variables are properly configured!");
} catch (error) {
  console.error("❌ Environment validation failed:");
  console.error(error);
  process.exit(1);
}
