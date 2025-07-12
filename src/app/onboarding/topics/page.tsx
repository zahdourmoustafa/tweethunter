"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

// Topic suggestions matching the design
const TOPIC_SUGGESTIONS = [
  "Startup",
  "Marketing", 
  "Audience building",
  "Seo",
  "Digital Marketing",
  "Copywriting",
  "Web Design",
  "Personal Branding",
  "Entrepreneurship", 
  "Productivity"
];

export default function TopicSelectionPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

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
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Tweet Hunter
          </h1>
          <p className="text-lg text-gray-500">
            Configure your personal AI
          </p>
        </div>

        {/* Define your topics section */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Define your topics
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              What do you want to post about?
            </p>
          </div>

          {/* Topic input with dropdown */}
          <div className="space-y-2">
            <p className="text-gray-500 text-sm">
              Type in or select your topics from suggestions
            </p>
            <div className="relative">
              <Input
                placeholder=""
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleAddCustomTopic()}
                className="h-12 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Selected topics display */}
          {selectedTopics.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTopics.map((topic) => (
                <Badge 
                  key={topic} 
                  variant="default" 
                  className="bg-blue-100 text-blue-800 hover:bg-blue-200 px-3 py-1 cursor-pointer"
                  onClick={() => handleTopicToggle(topic)}
                >
                  {topic} ×
                </Badge>
              ))}
            </div>
          )}

          {/* Suggestions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-500">
              Suggestions
            </h3>
            <div className="flex flex-wrap gap-3">
              {TOPIC_SUGGESTIONS.map((topic) => (
                <Badge
                  key={topic}
                  variant="outline"
                  className={`cursor-pointer px-4 py-2 text-sm border-2 transition-colors ${
                    selectedTopics.includes(topic)
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-white text-blue-500 border-blue-500 hover:bg-blue-50"
                  }`}
                  onClick={() => handleTopicToggle(topic)}
                >
                  {topic}
                </Badge>
              ))}
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Next button */}
        <div className="flex justify-end mt-16">
          <Button
            onClick={handleSubmit}
            disabled={selectedTopics.length === 0 || isSubmitting}
            className="bg-gray-200 text-gray-700 hover:bg-gray-300 px-8 py-2 rounded-md font-medium"
          >
            {isSubmitting ? "Saving..." : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
