// Server-side environment configuration
// This file should only be imported in server-side code

function validateServerEnv() {
  // Check if all required server env vars exist
  const requiredVars = [
    'DATABASE_URL',
    'BETTER_AUTH_SECRET', 
    'BETTER_AUTH_URL',
    'TWITTER_CLIENT_ID',
    'TWITTER_CLIENT_SECRET',
    'OPENAI_API_KEY',
    'TWITTERAPI_IO_API_KEY'
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
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
    TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID!,
    TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    TWITTERAPI_IO_API_KEY: process.env.TWITTERAPI_IO_API_KEY!,
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  };
}

// Export validated server environment variables
export const serverEnv = validateServerEnv();

// Type-safe server environment variables
export type ServerEnv = typeof serverEnv;
