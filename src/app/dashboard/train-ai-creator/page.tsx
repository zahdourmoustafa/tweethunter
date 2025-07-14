"use client";

import { useState } from "react";
import { TrainAiCreatorProvider } from "@/components/train-ai-creator/train-ai-creator-context";
import { UsernameInput } from "@/components/train-ai-creator/username-input";
import { TweetPreview } from "@/components/train-ai-creator/tweet-preview";
import { TrainingProgress } from "@/components/train-ai-creator/training-progress";
import { TrainingComplete } from "@/components/train-ai-creator/training-complete";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Sparkles } from "lucide-react";

export default function TrainAiCreatorPage() {
  return (
    <TrainAiCreatorProvider>
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Target className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Train AI from Creator</h1>
          </div>
          <p className="text-muted-foreground">
            Learn from viral creators and train your personalized AI to generate content using their proven patterns.
          </p>
        </div>

        {/* How it Works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5" />
              <span>How it Works</span>
            </CardTitle>
            <CardDescription>
              Our AI analyzes viral tweets to learn the patterns that make content go viral.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto font-semibold">
                  1
                </div>
                <h3 className="font-medium">Enter Creator</h3>
                <p className="text-sm text-muted-foreground">
                  Input a Twitter creator's username to analyze their viral content
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto font-semibold">
                  2
                </div>
                <h3 className="font-medium">Review Tweets</h3>
                <p className="text-sm text-muted-foreground">
                  We collect their top viral tweets (100k+ engagement, last 6 months)
                </p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto font-semibold">
                  3
                </div>
                <h3 className="font-medium">Train AI</h3>
                <p className="text-sm text-muted-foreground">
                  AI learns their patterns and becomes available in your toolkit
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content - Dynamic based on state */}
        <TrainAiCreatorContent />
      </div>
    </TrainAiCreatorProvider>
  );
}

function TrainAiCreatorContent() {
  return (
    <>
      <UsernameInput />
      <TweetPreview />
      <TrainingProgress />
      <TrainingComplete />
    </>
  );
}
