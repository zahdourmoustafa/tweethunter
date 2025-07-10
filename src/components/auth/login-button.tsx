"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signInWithTwitter } from "@/lib/auth-client";
import { Twitter } from "lucide-react";

interface LoginButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function LoginButton({ 
  variant = "default", 
  size = "default", 
  className,
  children 
}: LoginButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      await signInWithTwitter();
    } catch (error) {
      console.error("Login failed:", error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <Twitter className="mr-2 h-4 w-4" />
      {isLoading ? "Signing in..." : children || "Continue with Twitter"}
    </Button>
  );
}
