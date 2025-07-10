"use client";

import { useAuth } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  fallback,
  redirectTo = "/auth/login" 
}: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return fallback || <AuthGuardSkeleton />;
  }

  // Show nothing while redirecting
  if (!isAuthenticated) {
    return null;
  }

  // User is authenticated, show protected content
  return <>{children}</>;
}

function AuthGuardSkeleton() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}

// Reverse auth guard - only show content when NOT authenticated
export function GuestGuard({ 
  children, 
  redirectTo = "/dashboard" 
}: Omit<AuthGuardProps, "fallback">) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);

  // Show loading state
  if (isLoading) {
    return <AuthGuardSkeleton />;
  }

  // Show nothing while redirecting
  if (isAuthenticated) {
    return null;
  }

  // User is not authenticated, show guest content
  return <>{children}</>;
}
