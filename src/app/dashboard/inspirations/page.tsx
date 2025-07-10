import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Inspirations",
  description: "Discover viral tweets for inspiration",
};

export default function InspirationsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tweet Inspirations</h1>
        <p className="text-muted-foreground">
          Discover high-engagement tweets to inspire your content creation
        </p>
      </div>

      {/* Coming Soon Card */}
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>Tweet Discovery Coming Soon</CardTitle>
          <CardDescription>
            We're building the tweet discovery engine that will help you find viral content in your niche
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">What's coming:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Search tweets by topic and engagement metrics</li>
              <li>• Filter by time periods (7, 30, 90 days)</li>
              <li>• View detailed engagement analytics</li>
              <li>• AI-powered content generation tools</li>
            </ul>
          </div>
          <Button disabled>
            <Search className="mr-2 h-4 w-4" />
            Search Tweets (Coming Soon)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
