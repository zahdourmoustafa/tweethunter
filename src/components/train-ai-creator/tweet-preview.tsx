"use client";

import { useState } from "react";
import { useTrainAiCreator, trainAiCreatorActions } from "./train-ai-creator-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, 
  Repeat2, 
  MessageCircle, 
  Quote,
  Eye,
  Calendar,
  TrendingUp,
  Sparkles,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { ViralTweet, StartTrainingRequest, StartTrainingResponse } from "@/lib/types/training";
import { formatDistanceToNow } from "date-fns";

export function TweetPreview() {
  const { state, dispatch } = useTrainAiCreator();
  const [selectedTweets, setSelectedTweets] = useState<Set<string>>(new Set());
  const [isStartingTraining, setIsStartingTraining] = useState(false);

  // Only show this component on the preview step
  if (state.currentStep !== 'preview') {
    return null;
  }

  const handleTweetToggle = (tweetId: string) => {
    const newSelected = new Set(selectedTweets);
    if (newSelected.has(tweetId)) {
      newSelected.delete(tweetId);
    } else {
      newSelected.add(tweetId);
    }
    setSelectedTweets(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTweets.size === state.tweets.length) {
      setSelectedTweets(new Set());
    } else {
      setSelectedTweets(new Set(state.tweets.map(t => t.id)));
    }
  };

  const handleStartTraining = async () => {
    const tweetsToTrain = selectedTweets.size > 0 
      ? state.tweets.filter(t => selectedTweets.has(t.id))
      : state.tweets;

    if (tweetsToTrain.length === 0) {
      return;
    }

    setIsStartingTraining(true);

    try {
      const request: StartTrainingRequest = {
        tweets: tweetsToTrain,
        creatorUsername: state.creatorInfo?.username || state.username,
      };

      const response = await fetch('/api/train-ai/start-training', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: StartTrainingResponse = await response.json();

      if (!data.success) {
        dispatch(trainAiCreatorActions.setError(data.error || 'Failed to start training'));
        return;
      }

      if (!data.data) {
        dispatch(trainAiCreatorActions.setError('No training ID received'));
        return;
      }

      // Success - move to training step
      dispatch(trainAiCreatorActions.setTraining(data.data.trainingId));

    } catch (error) {
      console.error('Error starting training:', error);
      dispatch(trainAiCreatorActions.setError('Network error. Please try again.'));
    } finally {
      setIsStartingTraining(false);
    }
  };

  const handleGoBack = () => {
    dispatch(trainAiCreatorActions.goToStep('input'));
  };

  const tweetsToTrain = selectedTweets.size > 0 
    ? state.tweets.filter(t => selectedTweets.has(t.id))
    : state.tweets;

  const totalEngagementSelected = tweetsToTrain.reduce((sum, tweet) => sum + tweet.totalEngagement, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Viral Tweets Collected</span>
              </CardTitle>
              <CardDescription>
                Review the viral tweets we found and select which ones to train your AI with.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleGoBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Creator Info */}
          {state.creatorInfo && (
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="h-12 w-12">
                <AvatarImage src={state.creatorInfo.profilePicture} alt={state.creatorInfo.name} />
                <AvatarFallback>{state.creatorInfo.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{state.creatorInfo.name}</h3>
                <p className="text-sm text-muted-foreground">@{state.creatorInfo.username}</p>
                <p className="text-xs text-muted-foreground">
                  {state.creatorInfo.followers.toLocaleString()} followers
                </p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{state.tweets.length}</div>
              <div className="text-sm text-muted-foreground">Viral Tweets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {(state.totalEngagement / 1000000).toFixed(1)}M
              </div>
              <div className="text-sm text-muted-foreground">Total Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {Math.round(state.totalEngagement / state.tweets.length / 1000)}K
              </div>
              <div className="text-sm text-muted-foreground">Avg Engagement</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">6</div>
              <div className="text-sm text-muted-foreground">Months Analyzed</div>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedTweets.size === state.tweets.length ? 'Deselect All' : 'Select All'}
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedTweets.size > 0 
                  ? `${selectedTweets.size} selected` 
                  : 'All tweets will be used for training'
                }
              </span>
            </div>
            <Badge variant="secondary">
              {totalEngagementSelected.toLocaleString()} total engagement
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tweet List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Viral Tweets</CardTitle>
          <CardDescription>
            These tweets will be used to train your AI. Click to select/deselect individual tweets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {state.tweets.map((tweet, index) => (
                <TweetCard
                  key={tweet.id}
                  tweet={tweet}
                  index={index}
                  isSelected={selectedTweets.has(tweet.id)}
                  onToggle={() => handleTweetToggle(tweet.id)}
                />
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Training Action */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Ready to Train Your AI?</h3>
              <p className="text-muted-foreground">
                We'll analyze {tweetsToTrain.length} viral tweets to create your personalized AI model.
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleStartTraining}
              disabled={isStartingTraining || tweetsToTrain.length === 0}
              className="min-w-[200px]"
            >
              {isStartingTraining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting Training...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Train AI ({tweetsToTrain.length} tweets)
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Training will take 2-5 minutes to complete
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface TweetCardProps {
  tweet: ViralTweet;
  index: number;
  isSelected: boolean;
  onToggle: () => void;
}

function TweetCard({ tweet, index, isSelected, onToggle }: TweetCardProps) {
  const tweetDate = new Date(tweet.createdAt);
  const timeAgo = formatDistanceToNow(tweetDate, { addSuffix: true });

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-start space-x-3">
        {/* Ranking */}
        <div className="flex-shrink-0">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {index + 1}
          </div>
        </div>

        {/* Tweet Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={tweet.author.profilePicture} alt={tweet.author.name} />
              <AvatarFallback className="text-xs">{tweet.author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="font-medium text-sm">{tweet.author.name}</span>
            <span className="text-muted-foreground text-sm">@{tweet.author.userName}</span>
            <span className="text-muted-foreground text-xs">•</span>
            <span className="text-muted-foreground text-xs">{timeAgo}</span>
          </div>

          <p className="text-sm mb-3 leading-relaxed whitespace-pre-wrap">{tweet.text}</p>

          {/* Engagement Metrics */}
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Heart className="h-3 w-3" />
              <span>{tweet.likeCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Repeat2 className="h-3 w-3" />
              <span>{tweet.retweetCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center space-x-1">
              <MessageCircle className="h-3 w-3" />
              <span>{tweet.replyCount.toLocaleString()}</span>
            </div>
            {tweet.quoteCount > 0 && (
              <div className="flex items-center space-x-1">
                <Quote className="h-3 w-3" />
                <span>{tweet.quoteCount.toLocaleString()}</span>
              </div>
            )}
            {tweet.viewCount > 0 && (
              <div className="flex items-center space-x-1">
                <Eye className="h-3 w-3" />
                <span>{(tweet.viewCount / 1000000).toFixed(1)}M</span>
              </div>
            )}
          </div>

          {/* Total Engagement Badge */}
          <div className="mt-2">
            <Badge variant="secondary" className="text-xs">
              {tweet.totalEngagement.toLocaleString()} total engagement
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
