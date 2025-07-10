import { Metadata } from "next";
import { GuestGuard } from "@/components/auth/auth-guard";
import { LoginButton } from "@/components/auth/login-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_CONFIG } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your TweetInspire account",
};

export default function LoginPage() {
  return (
    <GuestGuard>
      <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left side - Branding */}
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-700" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-2 h-6 w-6"
            >
              <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
            </svg>
            {APP_CONFIG.name}
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &quot;TweetInspire has transformed how I create content. The AI tools help me turn viral tweets into authentic, engaging posts that resonate with my audience.&quot;
              </p>
              <footer className="text-sm">Sofia Davis, Content Creator</footer>
            </blockquote>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">
                Welcome back
              </h1>
              <p className="text-sm text-muted-foreground">
                Sign in with your Twitter account to continue
              </p>
            </div>

            <Card>
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center">Sign in</CardTitle>
                <CardDescription className="text-center">
                  Connect your Twitter account to get started
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <LoginButton size="lg" className="w-full">
                  Continue with Twitter
                </LoginButton>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Secure OAuth 2.0
                    </span>
                  </div>
                </div>

                <p className="px-8 text-center text-sm text-muted-foreground">
                  By clicking continue, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4 hover:text-primary"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
