import { AuthGuard } from "@/components/auth/auth-guard";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <OnboardingGuard>
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <DashboardSidebar />
          
          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <DashboardHeader />
            <main className="flex-1 overflow-y-auto p-6">
              {children}
            </main>
          </div>
        </div>
        <Toaster />
      </OnboardingGuard>
    </AuthGuard>
  );
}
