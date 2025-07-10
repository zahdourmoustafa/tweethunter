import { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Authenticating...",
  description: "Completing your sign in process",
};

export default function CallbackPage() {
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
