import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Authentication Error",
  description: "There was an error signing you in",
};

interface AuthErrorPageProps {
  searchParams: Promise<{
    error?: string;
    error_description?: string;
  }>;
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const params = await searchParams;
  const error = params.error;
  const errorDescription = params.error_description;

  const getErrorMessage = (error?: string) => {
    switch (error) {
      case "access_denied":
        return "You cancelled the authentication process. Please try again to continue.";
      case "invalid_request":
        return "There was an issue with the authentication request. Please try again.";
      case "server_error":
        return "We're experiencing technical difficulties. Please try again in a few minutes.";
      case "temporarily_unavailable":
        return "Authentication is temporarily unavailable. Please try again later.";
      default:
        return errorDescription || "An unexpected error occurred during authentication.";
    }
  };

  return (
    <div className="container relative min-h-screen flex-col items-center justify-center flex">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]">
        <div className="flex flex-col space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Authentication Failed
          </h1>
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t sign you in to your account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">What happened?</CardTitle>
            <CardDescription className="text-center">
              {getErrorMessage(error)}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Button asChild>
                <Link href="/auth/login">
                  Try Again
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/">
                  Go Home
                </Link>
              </Button>
            </div>

            {error && (
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Error Code:</strong> {error}
                </p>
                {errorDescription && (
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Details:</strong> {errorDescription}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          If this problem persists, please{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-primary">
            contact support
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
