"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Laptop, 
  Briefcase, 
  Megaphone, 
  Cloud, 
  DollarSign, 
  Zap,
  Plus,
  X,
  Sparkles
} from "lucide-react";
import { APP_CONFIG } from "@/lib/constants";

// Predefined topic categories
const PREDEFINED_TOPICS = [
  {
    category: "Tech",
    icon: Laptop,
    topics: ["Programming", "AI & Machine Learning", "Web Development", "Mobile Development", "DevOps", "Cybersecurity"]
  },
  {
    category: "Business",
    icon: Briefcase,
    topics: ["Entrepreneurship", "Leadership", "Strategy", "Management", "Startups", "Business Growth"]
  },
  {
    category: "Marketing",
    icon: Megaphone,
    topics: ["Digital Marketing", "Content Marketing", "Social Media", "SEO", "Email Marketing", "Brand Building"]
  },
  {
    category: "SaaS",
    icon: Cloud,
    topics: ["Product Management", "B2B Sales", "Customer Success", "SaaS Metrics", "Product-Led Growth", "SaaS Marketing"]
  },
  {
    category: "Finance",
    icon: DollarSign,
    topics: ["Investing", "Personal Finance", "Cryptocurrency", "Trading", "Financial Planning", "FinTech"]
  },
  {
    category: "Productivity",
    icon: Zap,
    topics: ["Time Management", "Productivity Tools", "Workflows", "Remote Work", "Life Hacks", "Goal Setting"]
  }
];

export default function TopicSelectionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Redirect if user already has topics
  if (user?.topics && user.topics.length > 0) {
    router.push("/dashboard");
    return null;
  }

  // Show loading if auth is still loading
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  const handleTopicToggle = (topic: string) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else if (prev.length < 5) {
        return [...prev, topic];
      }
      return prev;
    });
    setError("");
  };

  const handleAddCustomTopic = () => {
    if (!customTopic.trim()) return;
    
    if (selectedTopics.length >= 5) {
      setError("You can select maximum 5 topics");
      return;
    }

    if (selectedTopics.includes(customTopic.trim())) {
      setError("Topic already selected");
      return;
    }

    setSelectedTopics(prev => [...prev, customTopic.trim()]);
    setCustomTopic("");
    setError("");
  };

  const handleRemoveTopic = (topic: string) => {
    setSelectedTopics(prev => prev.filter(t => t !== topic));
    setError("");
  };

  const handleSubmit = async () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topics: selectedTopics }),
      });

      if (!response.ok) {
        throw new Error("Failed to save topics");
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving topics:", error);
      setError("Failed to save topics. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="ml-3 text-2xl font-bold">{APP_CONFIG.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            What interests you?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose up to 5 topics that interest you. We'll use these to find the most relevant viral tweets for your content inspiration.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Topic Categories */}
          <div className="grid gap-6 mb-8">
            {PREDEFINED_TOPICS.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <category.icon className="h-5 w-5" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {category.topics.map((topic) => (
                      <Badge
                        key={topic}
                        variant={selectedTopics.includes(topic) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/10 transition-colors"
                        onClick={() => handleTopicToggle(topic)}
                      >
                        {topic}
                        {selectedTopics.includes(topic) && (
                          <X className="ml-1 h-3 w-3" />
                        )}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Custom Topic Input */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Custom Topic
              </CardTitle>
              <CardDescription>
                Don't see your interest? Add your own custom topic.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter your custom topic..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddCustomTopic()}
                  disabled={selectedTopics.length >= 5}
                />
                <Button 
                  onClick={handleAddCustomTopic}
                  disabled={!customTopic.trim() || selectedTopics.length >= 5}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Selected Topics */}
          {selectedTopics.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Selected Topics ({selectedTopics.length}/5)</CardTitle>
                <CardDescription>
                  These topics will be used to personalize your content discovery.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {selectedTopics.map((topic) => (
                    <Badge key={topic} variant="default" className="gap-1">
                      {topic}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveTopic(topic)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="text-center">
            <Button
              onClick={handleSubmit}
              disabled={selectedTopics.length === 0 || isSubmitting}
              size="lg"
              className="px-8"
            >
              {isSubmitting ? "Saving..." : "Continue to Dashboard"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              You can change these topics later in your settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
