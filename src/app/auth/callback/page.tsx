"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { Skeleton } from "@/components/ui/skeleton";

export default function CallbackPage() {
  const router = useRouter();
  const { user, isLoading, error } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User is authenticated, redirect to dashboard
        router.replace("/dashboard");
      } else if (error) {
        // Authentication failed, redirect to login with error
        console.error("Authentication error:", error);
        router.replace("/auth/login?error=authentication_failed");
      }
    }
  }, [user, isLoading, error, router]);

  if (error) {
    return (
      <div className="container relative min-h-screen flex-col items-center justify-center flex">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <div className="mx-auto mb-4 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-red-600">
              Authentication Failed
            </h1>
            <p className="text-sm text-muted-foreground">
              There was an error signing you in. Please try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center flex">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Completing sign in...
          </h1>
          <p className="text-sm text-muted-foreground">
            Please wait while we set up your account
          </p>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          This should only take a few seconds...
        </p>
      </div>
    </div>
  );
}
