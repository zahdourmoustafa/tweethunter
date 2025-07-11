"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Plus, X, Save, Loader2, Users, Twitter, Trash2, RotateCcw } from "lucide-react";
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

interface InspirationAccount {
  id: string;
  twitterUsername: string;
  displayName: string;
  avatarUrl?: string;
  verified: boolean;
  followerCount: string;
  bio?: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  
  // Inspiration accounts state
  const [inspirationAccounts, setInspirationAccounts] = useState<InspirationAccount[]>([]);
  const [newAccountUsername, setNewAccountUsername] = useState("");
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [accountError, setAccountError] = useState("");
  
  const { toast } = useToast();

  // Load current topics and inspiration accounts
  useEffect(() => {
    async function loadData() {
      try {
        // Load topics
        const topicsResponse = await fetch("/api/user/topics");
        if (topicsResponse.ok) {
          const topicsData = await topicsResponse.json();
          setSelectedTopics(topicsData.topics || []);
        }

        // Load inspiration accounts
        const accountsResponse = await fetch("/api/inspiration/accounts");
        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setInspirationAccounts(accountsData.data || []);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load settings");
      } finally {
        setIsLoading(false);
        setIsLoadingAccounts(false);
      }
    }

    loadData();
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

  // Inspiration accounts functions
  const handleAddAccount = async () => {
    if (!newAccountUsername.trim()) {
      setAccountError("Please enter a Twitter username");
      return;
    }

    if (inspirationAccounts.length >= 10) {
      setAccountError("Maximum 10 inspiration accounts allowed");
      return;
    }

    setIsAddingAccount(true);
    setAccountError("");

    try {
      const response = await fetch("/api/inspiration/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: newAccountUsername.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add account");
      }

      setInspirationAccounts(prev => [...prev, data.data]);
      setNewAccountUsername("");
      
      toast({
        title: "Account added",
        description: `@${data.data.twitterUsername} has been added to your inspiration accounts.`,
      });
    } catch (error: any) {
      console.error("Error adding inspiration account:", error);
      setAccountError(error.message || "Failed to add account. Please try again.");
    } finally {
      setIsAddingAccount(false);
    }
  };

  const handleRemoveAccount = async (accountId: string, username: string) => {
    try {
      const response = await fetch(`/api/inspiration/accounts?id=${accountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove account");
      }

      setInspirationAccounts(prev => prev.filter(acc => acc.id !== accountId));
      
      toast({
        title: "Account removed",
        description: `@${username} has been removed from your inspiration accounts.`,
      });
    } catch (error) {
      console.error("Error removing inspiration account:", error);
      setAccountError("Failed to remove account. Please try again.");
    }
  };

  const handleResetSeenTweets = async () => {
    try {
      const response = await fetch("/api/inspiration/feed", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to reset seen tweets");
      }

      toast({
        title: "Content refreshed",
        description: "Your seen tweets history has been cleared. You'll now see fresh content!",
      });
    } catch (error) {
      console.error("Error resetting seen tweets:", error);
      setAccountError("Failed to reset content. Please try again.");
    }
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

      {/* Inspiration Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Inspiration Accounts
            <Badge variant="secondary" className="ml-auto">
              Optional
            </Badge>
          </CardTitle>
          <CardDescription>
            Add Twitter accounts you want to follow for inspiration. We'll include their best content in your feed for more variety and fresh perspectives.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Accounts */}
          {inspirationAccounts.length > 0 && (
            <div>
              <h4 className="font-medium mb-3">
                Your Inspiration Accounts ({inspirationAccounts.length}/10)
              </h4>
              <div className="space-y-3">
                {inspirationAccounts.map((account) => (
                  <div 
                    key={account.id} 
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={account.avatarUrl} />
                      <AvatarFallback>
                        {account.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {account.displayName}
                        </p>
                        {account.verified && (
                          <Twitter className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>@{account.twitterUsername}</span>
                        <span>•</span>
                        <span>{account.followerCount} followers</span>
                      </div>
                      {account.bio && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {account.bio}
                        </p>
                      )}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveAccount(account.id, account.twitterUsername)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {inspirationAccounts.length === 0 && !isLoadingAccounts && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h4 className="font-medium mb-2">No inspiration accounts added yet</h4>
              <p className="text-sm">
                Add Twitter accounts to get personalized content recommendations and avoid repetitive tweets.
              </p>
            </div>
          )}

          {inspirationAccounts.length > 0 && (
            <Separator />
          )}

          {/* Add New Account */}
          <div>
            <h4 className="font-medium mb-3">Add Inspiration Account</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter Twitter username (e.g., naval, levelsio)"
                    value={newAccountUsername}
                    onChange={(e) => {
                      setNewAccountUsername(e.target.value);
                      setAccountError("");
                    }}
                    onKeyPress={(e) => e.key === "Enter" && handleAddAccount()}
                    disabled={inspirationAccounts.length >= 10 || isAddingAccount}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button 
                onClick={handleAddAccount}
                disabled={!newAccountUsername.trim() || inspirationAccounts.length >= 10 || isAddingAccount}
                variant="outline"
              >
                {isAddingAccount ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {inspirationAccounts.length >= 10 && (
              <p className="text-sm text-muted-foreground mt-2">
                Maximum 10 inspiration accounts reached. Remove one to add another.
              </p>
            )}
          </div>

          {/* Content Refresh */}
          {inspirationAccounts.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium mb-3">Content Variety</h4>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Seeing the same tweets repeatedly? Reset your history to get fresh content.
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleResetSeenTweets}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Refresh Content
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Account Error Message */}
          {accountError && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-destructive text-sm">{accountError}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
