"use client";

import { useAuth } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [userTopics, setUserTopics] = useState<string[] | null>(null);
  const [isCheckingTopics, setIsCheckingTopics] = useState(true);

  useEffect(() => {
    async function checkUserTopics() {
      if (!user || isLoading) return;

      try {
        const response = await fetch("/api/user/topics");
        if (response.ok) {
          const data = await response.json();
          setUserTopics(data.topics || []);
          
          // If user has no topics, redirect to onboarding
          if (!data.topics || data.topics.length === 0) {
            router.push("/onboarding/topics");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking user topics:", error);
        // On error, assume user needs onboarding
        router.push("/onboarding/topics");
        return;
      } finally {
        setIsCheckingTopics(false);
      }
    }

    checkUserTopics();
  }, [user, isLoading, router]);

  // Show loading while checking authentication and topics
  if (isLoading || isCheckingTopics) {
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

  // Don't render anything while redirecting
  if (!user || !userTopics || userTopics.length === 0) {
    return null;
  }

  // User is authenticated and has completed onboarding
  return <>{children}</>;
}
