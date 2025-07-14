"use client";

import { useState } from "react";
import { useTrainAiCreator, trainAiCreatorActions } from "./train-ai-creator-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle, Twitter } from "lucide-react";
import { AnalyzeCreatorRequest, AnalyzeCreatorResponse } from "@/lib/types/training";

export function UsernameInput() {
  const { state, dispatch } = useTrainAiCreator();
  const [inputValue, setInputValue] = useState("");

  // Only show this component on the input step
  if (state.currentStep !== 'input' && state.currentStep !== 'error') {
    return null;
  }

  const handleAnalyzeCreator = async () => {
    if (!inputValue.trim()) return;

    const username = inputValue.trim();
    dispatch(trainAiCreatorActions.setUsername(username));
    dispatch(trainAiCreatorActions.setValidating(true));

    try {
      const request: AnalyzeCreatorRequest = { username };
      
      const response = await fetch('/api/train-ai/analyze-creator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: AnalyzeCreatorResponse = await response.json();

      if (!data.success) {
        dispatch(trainAiCreatorActions.setError(data.error || 'Failed to analyze creator'));
        return;
      }

      if (!data.data) {
        dispatch(trainAiCreatorActions.setError('No data received from server'));
        return;
      }

      // Success - move to preview step
      dispatch(trainAiCreatorActions.setTweets({
        tweets: data.data.tweets,
        totalEngagement: data.data.totalEngagement,
        creatorInfo: data.data.creatorInfo,
      }));

    } catch (error) {
      console.error('Error analyzing creator:', error);
      dispatch(trainAiCreatorActions.setError('Network error. Please check your connection and try again.'));
    } finally {
      dispatch(trainAiCreatorActions.setValidating(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !state.isValidating) {
      handleAnalyzeCreator();
    }
  };

  const isLoading = state.isValidating || state.isCollecting;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Twitter className="h-5 w-5" />
          <span>Choose a Creator to Learn From</span>
        </CardTitle>
        <CardDescription>
          Enter the username of a Twitter creator whose viral content style you want to learn from.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error Alert */}
        {state.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        )}

        {/* Input Section */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                placeholder="Enter creator username (e.g., @levelsio, naval, elonmusk)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="pr-10"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Twitter className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <Button 
              onClick={handleAnalyzeCreator}
              disabled={!inputValue.trim() || isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Analyze Tweets
                </>
              )}
            </Button>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-4">
              <div className="space-y-2">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">
                  {state.isValidating ? 'Validating creator...' : 'Collecting viral tweets...'}
                </p>
                <p className="text-xs text-muted-foreground">
                  This may take up to 30 seconds
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Examples */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Popular creators to try:</p>
          <div className="flex flex-wrap gap-2">
            {['@levelsio', '@naval', '@elonmusk', '@garyvee', '@paulg'].map((example) => (
              <Button
                key={example}
                variant="outline"
                size="sm"
                onClick={() => setInputValue(example)}
                disabled={isLoading}
                className="text-xs"
              >
                {example}
              </Button>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium">What we'll analyze:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Tweets from the last 6 months</li>
            <li>• Content with 100k+ total engagement</li>
            <li>• Original tweets (not replies)</li>
            <li>• Up to 20 top-performing tweets</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
