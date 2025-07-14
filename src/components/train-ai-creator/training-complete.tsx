"use client";

import { useTrainAiCreator, trainAiCreatorActions } from "./train-ai-creator-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CheckCircle, 
  Sparkles, 
  Brain, 
  TrendingUp, 
  ArrowRight,
  RotateCcw,
  Zap
} from "lucide-react";
import Link from "next/link";

export function TrainingComplete() {
  const { state, dispatch } = useTrainAiCreator();

  // Only show this component on the complete step
  if (state.currentStep !== 'complete') {
    return null;
  }

  const handleTrainAnother = () => {
    dispatch(trainAiCreatorActions.resetState());
  };

  const modelName = state.creatorInfo 
    ? `${state.creatorInfo.name} Style AI`
    : `${state.username} Style AI`;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-700 dark:text-green-300">
                Training Complete!
              </h2>
              <p className="text-green-600 dark:text-green-400 mt-1">
                Your AI has successfully learned from {state.tweets.length} viral tweets
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Model Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Your New AI Model</span>
          </CardTitle>
          <CardDescription>
            Your personalized AI is now ready to generate viral content in your chosen creator's style.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Model Details */}
          <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
            {state.creatorInfo && (
              <Avatar className="h-12 w-12">
                <AvatarImage src={state.creatorInfo.profilePicture} alt={state.creatorInfo.name} />
                <AvatarFallback>{state.creatorInfo.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1">
              <h3 className="font-semibold flex items-center space-x-2">
                <span>{modelName}</span>
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              </h3>
              <p className="text-sm text-muted-foreground">
                Trained on {state.tweets.length} viral tweets with {state.totalEngagement.toLocaleString()} total engagement
              </p>
            </div>
          </div>

          {/* Training Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">{state.tweets.length}</div>
              <div className="text-xs text-muted-foreground">Viral Tweets</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {(state.totalEngagement / 1000000).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">Total Engagement</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {Math.round(state.totalEngagement / state.tweets.length / 1000)}K
              </div>
              <div className="text-xs text-muted-foreground">Avg Engagement</div>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="text-2xl font-bold text-primary">100%</div>
              <div className="text-xs text-muted-foreground">Success Rate</div>
            </div>
          </div>

          {/* What the AI Learned */}
          <div className="space-y-3">
            <h4 className="font-medium">What your AI learned:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2 text-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>Viral hook patterns and attention-grabbers</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Brain className="h-4 w-4 text-primary" />
                <span>Storytelling structures and narratives</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span>Emotional triggers and psychological patterns</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>Voice, tone, and personality traits</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
          <CardDescription>
            Your trained AI is now available in your toolkit. Start generating viral content!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Go to AI Editor */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Start Creating</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Use your new AI model in the tweet editor to generate viral content.
              </p>
              <Button asChild className="w-full">
                <Link href="/dashboard">
                  Go to AI Editor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Train Another */}
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center space-x-2">
                <RotateCcw className="h-5 w-5 text-primary" />
                <h4 className="font-medium">Train Another AI</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Learn from different creators to expand your AI toolkit.
              </p>
              <Button variant="outline" onClick={handleTrainAnother} className="w-full">
                Train Another Creator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium">💡 Pro Tips:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Your AI will appear as "{modelName}" in the AI tools sidebar</li>
              <li>• It maintains conversation history just like other AI tools</li>
              <li>• Try different prompts to explore various content styles</li>
              <li>• The AI works best when you provide your own ideas and context</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
