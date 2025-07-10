import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Analytics",
  description: "Track your content performance and usage",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Track your content performance and platform usage
        </p>
      </div>

      {/* Coming Soon */}
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BarChart3 className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>Analytics Dashboard Coming Soon</CardTitle>
          <CardDescription>
            We&apos;re building comprehensive analytics to track your content success
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <h4 className="font-medium">What&apos;s coming:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Content performance tracking</li>
              <li>• AI tool usage statistics</li>
              <li>• Engagement rate analysis</li>
              <li>• Growth metrics and insights</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
