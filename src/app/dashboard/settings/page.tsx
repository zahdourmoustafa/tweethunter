"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Plus, X, Save, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Same predefined topics as onboarding
const PREDEFINED_TOPICS = [
  {
    category: "Tech",
    topics: ["Programming", "AI & Machine Learning", "Web Development", "Mobile Development", "DevOps", "Cybersecurity"]
  },
  {
    category: "Business", 
    topics: ["Entrepreneurship", "Leadership", "Strategy", "Management", "Startups", "Business Growth"]
  },
  {
    category: "Marketing",
    topics: ["Digital Marketing", "Content Marketing", "Social Media", "SEO", "Email Marketing", "Brand Building"]
  },
  {
    category: "SaaS",
    topics: ["Product Management", "B2B Sales", "Customer Success", "SaaS Metrics", "Product-Led Growth", "SaaS Marketing"]
  },
  {
    category: "Finance",
    topics: ["Investing", "Personal Finance", "Cryptocurrency", "Trading", "Financial Planning", "FinTech"]
  },
  {
    category: "Productivity",
    topics: ["Time Management", "Productivity Tools", "Workflows", "Remote Work", "Life Hacks", "Goal Setting"]
  }
];

export default function SettingsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Load current topics
  useEffect(() => {
    async function loadTopics() {
      try {
        const response = await fetch("/api/user/topics");
        if (response.ok) {
          const data = await response.json();
          setSelectedTopics(data.topics || []);
        }
      } catch (error) {
        console.error("Error loading topics:", error);
        setError("Failed to load topics");
      } finally {
        setIsLoading(false);
      }
    }

    loadTopics();
  }, []);

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
    console.log('Removing topic:', topic);
    setSelectedTopics(prev => {
      const newTopics = prev.filter(t => t !== topic);
      console.log('New topics after removal:', newTopics);
      return newTopics;
    });
    setError("");
  };

  const handleSave = async () => {
    if (selectedTopics.length === 0) {
      setError("Please select at least one topic");
      return;
    }

    setIsSaving(true);
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

      toast({
        title: "Topics updated",
        description: "Your topic preferences have been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving topics:", error);
      setError("Failed to save topics. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>
        <div className="flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Topic Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Topic Preferences
          </CardTitle>
          <CardDescription>
            Choose up to 5 topics that interest you. These help us find relevant viral tweets for your content inspiration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Topics */}
          {selectedTopics.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">Selected Topics ({selectedTopics.length}/5)</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTopics.map((topic) => (
                  <Badge 
                    key={topic} 
                    variant="default" 
                    className="gap-1 pr-1"
                  >
                    <span>{topic}</span>
                    <button
                      type="button"
                      className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Remove button clicked for topic:', topic);
                        handleRemoveTopic(topic);
                      }}
                    >
                      <X className="h-3 w-3 text-current hover:text-destructive" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Predefined Topics */}
          <div className="space-y-4">
            <h4 className="font-medium">Available Topics</h4>
            {PREDEFINED_TOPICS.map((category) => (
              <div key={category.category}>
                <h5 className="text-sm font-medium text-muted-foreground mb-2">
                  {category.category}
                </h5>
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
                        <X 
                          className="ml-1 h-3 w-3 cursor-pointer hover:text-destructive" 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTopic(topic);
                          }}
                        />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <Separator />

          {/* Custom Topic Input */}
          <div>
            <h4 className="font-medium mb-3">Add Custom Topic</h4>
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
                variant="outline"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={selectedTopics.length === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
