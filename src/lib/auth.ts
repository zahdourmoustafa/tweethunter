import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/lib/db";
import { serverEnv } from "@/config/env.server";

// Automatically detect the correct base URL
function getBaseURL() {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_URL must be set in production');
  }
  return 'http://localhost:3000';
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  
  secret: serverEnv.BETTER_AUTH_SECRET,
  baseURL: getBaseURL(),
  
  emailAndPassword: {
    enabled: false, // We only want Twitter OAuth
  },
  
  socialProviders: {
    twitter: {
      clientId: serverEnv.TWITTER_CLIENT_ID,
      clientSecret: serverEnv.TWITTER_CLIENT_SECRET,
    },
  },
  
  plugins: [
    nextCookies(), // Required for Next.js integration
  ],
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
});

// Export types for client-side usage
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
