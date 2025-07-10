// Main environment configuration
// This combines server and client env based on context

import { isServer } from "@/lib/utils";

// Server-side environment (only available on server)
function validateServerEnv() {
  if (!isServer()) {
    // Return empty object for client-side, server env not needed
    return {};
  }

  const requiredVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET', 
    'TWITTER_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'TWITTER_BEARER_TOKEN'
  ];

  const missing = requiredVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`❌ Missing server environment variables: ${missing.join(', ')}`);
  }

  // Check BETTER_AUTH_SECRET length
  if (process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('❌ BETTER_AUTH_SECRET must be at least 32 characters');
  }

  return {
    DATABASE_URL: process.env.DATABASE_URL!,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN!,
  };
}

// Client-side environment (available on both server and client)
function validateClientEnv() {
  return {
    BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    TWITTER_CLIENT_ID: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || process.env.TWITTER_CLIENT_ID || "",
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  };
}

// Export combined environment
const serverEnv = validateServerEnv();
const clientEnv = validateClientEnv();

export const env = {
  ...serverEnv,
  ...clientEnv,
};

// Type-safe environment variables
export type Env = typeof env;

// Helper functions for environment checks
export const isDevelopment = env.NODE_ENV === "development";
export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
