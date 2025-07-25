// Client-side environment configuration
// Only NEXT_PUBLIC_ prefixed variables are available on the client

function getClientBaseURL() {
  // Priority order: explicit NEXT_PUBLIC env var, then VERCEL_URL, then fallback
  if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
  }
  
  // For Vercel deployments, use VERCEL_URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // In browser, use current location as fallback
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.host}`;
  }
  
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_BETTER_AUTH_URL must be set in production');
  }
  return 'http://localhost:3000';
}

function validateClientEnv() {
  // These should be NEXT_PUBLIC_ prefixed for client access
  const clientEnv = {
    BETTER_AUTH_URL: getClientBaseURL(),
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
