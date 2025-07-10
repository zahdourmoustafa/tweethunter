"use client";

import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/config/env.client";

export const authClient = createAuthClient({
  baseURL: clientEnv.BETTER_AUTH_URL,
  
  // Configure social providers
  socialProviders: {
    twitter: {
      enabled: true,
    },
  },
});

// Export hooks for easy usage
export const {
  useSession,
  signIn,
  signOut,
  signUp,
  useActiveSession,
} = authClient;

// Custom hooks for better UX
export function useAuth() {
  const session = useSession();
  
  return {
    user: session.data?.user ?? null,
    session: session.data?.session ?? null,
    isLoading: session.isPending,
    isAuthenticated: !!session.data?.user,
    error: session.error,
  };
}

// Twitter-specific sign in function
export async function signInWithTwitter() {
  try {
    await signIn.social({
      provider: "twitter",
      callbackURL: "/dashboard",
    });
  } catch (error) {
    console.error("Twitter sign-in error:", error);
    throw error;
  }
}

// Sign out function with redirect
export async function signOutUser() {
  try {
    await signOut({
      redirectTo: "/",
    });
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}
