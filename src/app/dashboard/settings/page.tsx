import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your account settings and preferences",
};

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Coming Soon */}
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Settings className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Settings Coming Soon</CardTitle>
          <CardDescription>
            We're building comprehensive settings to customize your experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium">What's coming:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Topic preferences and interests</li>
              <li>• AI tool customization</li>
              <li>• Notification settings</li>
              <li>• Account management</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
