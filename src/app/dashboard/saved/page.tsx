import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark } from "lucide-react";

export const metadata: Metadata = {
  title: "Saved Content",
  description: "Your saved tweets and generated content",
};

export default function SavedPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Saved Content</h1>
        <p className="text-muted-foreground">
          Your library of generated content and saved tweets
        </p>
      </div>

      {/* Empty State */}
      <Card className="text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bookmark className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle>No saved content yet</CardTitle>
          <CardDescription>
            Start by finding viral tweets and using our AI tools to generate content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Your saved tweets and AI-generated content will appear here
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
