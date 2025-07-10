#!/usr/bin/env tsx

import { config } from "dotenv";
config(); // Load .env file for server-side testing

import { testConnection, healthCheck } from "../src/lib/db";

console.log("🔍 Testing database connection...\n");

async function main() {
  try {
    // Test basic connection
    const connectionTest = await testConnection();
    
    if (connectionTest.success) {
      console.log("✅ Database connection successful!");
    } else {
      console.error("❌ Database connection failed:", connectionTest.error);
      return;
    }

    // Test health check
    const health = await healthCheck();
    console.log(`📊 Database health: ${health.status}`);
    console.log(`⚡ Response time: ${health.duration}ms`);
    console.log(`🕐 Timestamp: ${health.timestamp}`);

    console.log("\n🎉 Database is ready for use!");
    
  } catch (error) {
    console.error("❌ Database test failed:", error);
    process.exit(1);
  }
}

main();
