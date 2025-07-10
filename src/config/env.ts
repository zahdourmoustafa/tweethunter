// Load environment variables from .env file
import { config } from "dotenv";
config();

// Simple validation function
function validateEnv() {
  // Check if all required env vars exist
  const requiredVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET', 
    'BETTER_AUTH_URL',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'TWITTER_BEARER_TOKEN'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`❌ Missing environment variables: ${missing.join(', ')}`);
  }

  // Check BETTER_AUTH_SECRET length
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('❌ BETTER_AUTH_SECRET must be at least 32 characters');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID!,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN!,
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  };
}

// Export validated environment variables
export const env = validateEnv();

// Type-safe environment variables
export type Env = typeof env;

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
