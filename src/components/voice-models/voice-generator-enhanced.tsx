/**
 * Enhanced Voice Generator Component
 * Supports both tweet and thread generation with voice model selection
 * Uses left/right layout pattern consistent with existing design
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVoiceModels } from '@/hooks/use-voice-models';
import { useAIGeneration } from '@/hooks/use-ai-generation';
import { ContentType, AITool, VoiceGeneratorOptions } from '@/lib/types/aiTools';
import { 
  Sparkles, 
  Twitter, 
  AlertCircle, 
  Settings,
  Lightbulb,
  Wand2,
  MessageSquare,
  List,
  Copy,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface VoiceGeneratorEnhancedProps {
  onContentGenerated?: (content: string) => void;
  initialContent?: string;
}

interface GeneratedContent {
  id: string;
  content: string;
  contentType: ContentType;
  voiceModelId: string;
  timestamp: Date;
}

export function VoiceGeneratorEnhanced({ 
  onContentGenerated, 
  initialContent = '' 
}: VoiceGeneratorEnhancedProps) {
  const { voiceModels, loading: modelsLoading } = useVoiceModels();
  const { generateContent, isGenerating, error } = useAIGeneration();

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('');
  const [contentType, setContentType] = useState<ContentType>(ContentType.Tweet);
  const [idea, setIdea] = useState(initialContent);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);

  const selectedVoice = voiceModels.find(model => model.id === selectedVoiceId);

  // Update idea when initialContent changes
  useEffect(() => {
    if (initialContent && initialContent !== idea) {
      setIdea(initialContent);
    }
  }, [initialContent]);

  const handleGenerate = async () => {
    if (!selectedVoiceId || !idea.trim()) {
      toast.error('Please select a voice model and provide an idea');
      return;
    }

    try {
      const options: VoiceGeneratorOptions = {
        contentType,
        voiceModelId: selectedVoiceId,
      };

      const result = await generateContent(AITool.VoiceGenerator, idea.trim(), options);
      
      const newContent: GeneratedContent = {
        id: Date.now().toString(),
        content: result.content,
        contentType,
        voiceModelId: selectedVoiceId,
        timestamp: new Date(),
      };

      setGeneratedContent(prev => [newContent, ...prev]);
      
      // Auto-apply content if callback provided
      if (onContentGenerated) {
        onContentGenerated(result.content);
      }
      
      toast.success(`${contentType === ContentType.Tweet ? 'Tweet' : 'Thread'} generated successfully!`);
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate content';
      toast.error(errorMessage);
    }
  };

  const handleRegenerate = async (contentId: string) => {
    const content = generatedContent.find(c => c.id === contentId);
    if (!content) return;

    try {
      const options: VoiceGeneratorOptions = {
        contentType: content.contentType,
        voiceModelId: content.voiceModelId,
      };

      const result = await generateContent(AITool.VoiceGenerator, idea.trim(), options);
      
      setGeneratedContent(prev => 
        prev.map(c => 
          c.id === contentId 
            ? { ...c, content: result.content, timestamp: new Date() }
            : c
        )
      );

      toast.success('Content regenerated successfully!');
    } catch (err) {
      console.error('Regeneration error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate content';
      toast.error(errorMessage);
    }
  };

  const handleCopyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Content copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy content');
    }
  };

  const handleApplyContent = (content: string) => {
    if (onContentGenerated) {
      onContentGenerated(content);
      toast.success('Content applied to editor!');
    }
  };

  // Show loading state
  if (modelsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            Loading voice models...
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no voice models
  if (voiceModels.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Twitter className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-3">No Voice Models Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create voice models from Twitter accounts to start generating content in their unique style.
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
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Panel - Input Controls */}
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Voice Generator
            </CardTitle>
            <CardDescription>
              Generate tweets or threads using AI-powered voice models from Twitter accounts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Type Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Content Type</label>
              <Tabs value={contentType} onValueChange={(value) => setContentType(value as ContentType)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value={ContentType.Tweet} className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Tweet
                  </TabsTrigger>
                  <TabsTrigger value={ContentType.Thread} className="flex items-center gap-2">
                    <List className="w-4 h-4" />
                    Thread
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <p className="text-xs text-muted-foreground">
                {contentType === ContentType.Tweet 
                  ? 'Generate a single tweet (up to 280 characters)'
                  : 'Generate a multi-tweet thread with connected ideas'
                }
              </p>
            </div>

            <Separator />

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
                placeholder={
                  contentType === ContentType.Tweet
                    ? "Describe your tweet idea here... (e.g., 'The importance of building in public for startups')"
                    : "Describe your thread topic here... (e.g., '5 lessons I learned from my first startup failure')"
                }
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
              disabled={!selectedVoiceId || !idea.trim() || isGenerating}
              className="w-full"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate {contentType === ContentType.Tweet ? 'Tweet' : 'Thread'}
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
            {contentType === ContentType.Tweet ? (
              <>
                <p>• Be specific about your topic or message</p>
                <p>• Include context or background information</p>
                <p>• Mention your target audience if relevant</p>
                <p>• Keep ideas focused on a single concept</p>
              </>
            ) : (
              <>
                <p>• Structure your idea with clear main points</p>
                <p>• Think about the story arc or progression</p>
                <p>• Include specific examples or case studies</p>
                <p>• Consider actionable takeaways for readers</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Results */}
      <div className="lg:col-span-2">
        {generatedContent.length === 0 ? (
          <Card className="border-dashed h-full">
            <CardContent className="pt-6">
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-6" />
                <h3 className="text-xl font-semibold mb-3">No content generated yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Select a voice model and describe your idea to generate {contentType === ContentType.Tweet ? 'tweets' : 'threads'} in their unique style.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Sparkles className="w-4 h-4" />
                  <span>Generated content will appear here</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Generated Content</h3>
              <Badge variant="outline">{generatedContent.length} generated</Badge>
            </div>
            
            <div className="space-y-4">
              {generatedContent.map((content) => {
                const voiceModel = voiceModels.find(m => m.id === content.voiceModelId);
                return (
                  <Card key={content.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {content.contentType === ContentType.Tweet ? 'Tweet' : 'Thread'}
                          </Badge>
                          {voiceModel && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Twitter className="w-3 h-3" />
                              @{voiceModel.twitterUsername}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRegenerate(content.id)}
                            disabled={isGenerating}
                          >
                            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyContent(content.content)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {onContentGenerated && (
                            <Button
                              size="sm"
                              onClick={() => handleApplyContent(content.content)}
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg border">
                        {content.content}
                      </div>
                      <div className="mt-3 text-xs text-muted-foreground">
                        Generated {content.timestamp.toLocaleString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
