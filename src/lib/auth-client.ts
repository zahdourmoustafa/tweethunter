"use client";

import { createAuthClient } from "better-auth/react";
import { clientEnv } from "@/config/env.client";

export const authClient = createAuthClient({
  baseURL: clientEnv.BETTER_AUTH_URL,
});

// Export hooks for easy usage
export const {
  useSession,
  signIn,
  signOut,
  signUp,
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

// Twitter-specific sign in function using social provider
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
    await signOut();
    // Manually redirect after sign out
    window.location.href = "/";
  } catch (error) {
    console.error("Sign-out error:", error);
    throw error;
  }
}
