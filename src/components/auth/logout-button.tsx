"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { signOutUser } from "@/lib/auth-client";
import { LogOut } from "lucide-react";

interface LogoutButtonProps {
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ 
  variant = "ghost", 
  size = "sm", 
  className,
  children 
}: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOutUser();
    } catch (error) {
      console.error("Logout failed:", error);
      // You could add toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleSignOut}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <LogOut className="mr-2 h-4 w-4" />
      {isLoading ? "Signing out..." : children || "Sign out"}
    </Button>
  );
}
