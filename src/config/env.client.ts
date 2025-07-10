// Client-side environment configuration
// Only NEXT_PUBLIC_ prefixed variables are available on the client

function validateClientEnv() {
  // These should be NEXT_PUBLIC_ prefixed for client access
  const clientEnv = {
    BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
    TWITTER_CLIENT_ID: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || "",
    NODE_ENV: (process.env.NODE_ENV as "development" | "production" | "test") || "development",
  };

  return clientEnv;
}

// Export validated client environment variables
export const clientEnv = validateClientEnv();

// Type-safe client environment variables
export type ClientEnv = typeof clientEnv;

// Helper functions for environment checks
export const isDevelopment = clientEnv.NODE_ENV === "development";
export const isProduction = clientEnv.NODE_ENV === "production";
export const isTest = clientEnv.NODE_ENV === "test";
