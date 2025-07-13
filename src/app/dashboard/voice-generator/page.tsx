/**
 * Voice Tweet Generator Page
 * Main interface for generating tweets using voice models
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useVoiceModels } from '@/hooks/use-voice-models';
import { useTweetGeneration } from '@/hooks/use-tweet-generation';
import { TweetVariationCards } from '@/components/voice-models/tweet-variation-cards';
import { 
  Sparkles, 
  Twitter, 
  AlertCircle, 
  Settings,
  Lightbulb,
  Wand2
} from 'lucide-react';
import Link from 'next/link';

export default function VoiceTweetGeneratorPage() {
  const { voiceModels, loading: modelsLoading } = useVoiceModels();
  const { 
    generateTweets, 
    regenerateVariation,
    variations, 
    loading: generating, 
    error 
  } = useTweetGeneration();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [idea, setIdea] = useState('');

  const selectedVoice = voiceModels.find(model => model.id === selectedVoiceId);

  const handleGenerate = async () => {
    if (!selectedVoiceId || !idea.trim()) return;
    
    await generateTweets(selectedVoiceId, idea.trim());
  };

  const handleRegenerate = async (variationType: string): Promise<boolean> => {
    if (!selectedVoiceId || !idea.trim()) return false;
    
    return await regenerateVariation(selectedVoiceId, idea.trim(), variationType);
  };

  // Show loading state
  if (modelsLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Tweet Generator</h1>
          <p className="text-muted-foreground">
            Loading your voice models...
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Show empty state if no voice models
  if (voiceModels.length === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Voice Tweet Generator</h1>
          <p className="text-muted-foreground">
            Generate tweets in the style of your favorite Twitter accounts
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Twitter className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
              <h3 className="text-xl font-semibold mb-3">No Voice Models Yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Create voice models from Twitter accounts to start generating tweets in their unique style.
              </p>
              <Link href="/dashboard/settings">
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Create Voice Models
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Voice Tweet Generator</h1>
        <p className="text-muted-foreground">
          Transform your ideas into tweets using AI-powered voice models
        </p>
      </div>

      {/* Generation Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Generate Tweets
              </CardTitle>
              <CardDescription>
                Select a voice model and describe your idea to generate tweet variations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Voice Model Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Voice Model</label>
                <Select value={selectedVoiceId} onValueChange={setSelectedVoiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a voice model" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <Twitter className="w-4 h-4 text-blue-500" />
                          <span>@{model.twitterUsername}</span>
                          {model.displayName && model.displayName !== model.twitterUsername && (
                            <span className="text-muted-foreground">
                              ({model.displayName})
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedVoice && (
                  <div className="flex items-center gap-2 mt-2">
                    <Badge 
                      variant="outline" 
                      className={
                        selectedVoice.confidenceScore >= 80 
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : selectedVoice.confidenceScore >= 60
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }
                    >
                      {selectedVoice.confidenceScore}% confidence
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedVoice.tweetCount} tweets analyzed
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Idea Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Idea</label>
                <Textarea
                  placeholder="Describe your tweet idea here... (e.g., 'The importance of building in public for startups')"
                  value={idea}
                  onChange={(e) => setIdea(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="resize-none"
                />
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>{idea.length}/500 characters</span>
                  {idea.length > 400 && (
                    <span className="text-amber-600">Keep it concise for better results</span>
                  )}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGenerate}
                disabled={!selectedVoiceId || !idea.trim() || generating}
                className="w-full"
                size="lg"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate Tweet Variations
                  </>
                )}
              </Button>

              {/* Error Display */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lightbulb className="w-5 h-5" />
                Tips for Better Results
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <p>• Be specific about your topic or message</p>
              <p>• Include context or background information</p>
              <p>• Mention your target audience if relevant</p>
              <p>• Keep ideas focused on a single concept</p>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <TweetVariationCards
            variations={variations}
            onRegenerate={handleRegenerate}
            loading={generating}
            selectedVoice={selectedVoice}
            originalIdea={idea}
          />
        </div>
      </div>
    </div>
  );
}
