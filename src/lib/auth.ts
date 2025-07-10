import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { serverEnv } from "@/config/env.server";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  
  emailAndPassword: {
    enabled: false, // We only want Twitter OAuth
  },
  
  socialProviders: {
    twitter: {
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: serverEnv.TWITTER_CLIENT_SECRET,
    },
  },
  
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  
  advanced: {
    useSecureCookies: serverEnv.NODE_ENV === "production",
    generateId: () => crypto.randomUUID(),
  },
});

// Export types for client-side usage
export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
