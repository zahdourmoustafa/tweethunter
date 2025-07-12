"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  ExternalLink, 
  Heart, 
  MessageCircle, 
  Repeat2, 
  TrendingUp,
  AlertTriangle,
  Globe,
  Wifi,
  Eye,
  Link2,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Zap,
  Users,
  RotateCcw,
  Edit,
  Copy,
  Save,
  MessageSquare,
  Sparkles,
  PenTool,
  Smile,
  Scissors,
  Expand,
  Target,
  Megaphone,
  Dumbbell,
  Coffee,
  Briefcase,
  Settings,
  Lightbulb
} from "lucide-react";
import { EditorProvider, useEditorContext } from "@/components/ai-editor/editor-context";
import { AIToolModalV2 } from "@/components/ai-editor/ai-tool-modal-v2";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIGeneration } from "@/hooks/use-ai-generation";
import { AITool } from "@/lib/types/aiTools";
import { toast } from "sonner";



interface Tweet {
  id: string;
  text: string;
  author: {
    name: string;
    username: string;
    profile_image_url: string;
    verified: boolean;
  };
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count: number;
  };
  created_at: string;
  // Thread/conversation context
  conversation_id?: string;
  in_reply_to_user_id?: string;
  referenced_tweets?: Array<{
    type: 'replied_to' | 'quoted' | 'retweeted';
    id: string;
  }>;
  // Expanded thread context
  thread_context?: {
    is_thread: boolean;
    thread_position?: number;
    total_tweets?: number;
    thread_tweets?: Tweet[];
  };
  // Enhanced source information
  source?: 'inspiration_account' | 'trending' | 'similar_account';
  source_account?: string;
  sourceLabel?: string;
}

interface ApiResponse {
  status: string;
  data: {
    tweets: Tweet[];
    stats: {
      total: number;
      inspirationAccounts: number;
      unseenCount: number;
      hasInspirationAccounts: boolean;
    };
  };
  error?: string;
}

interface AIToolConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: 'enhance' | 'tone' | 'format' | 'generate';
}

// AI Tools Configuration
const AI_TOOLS: AIToolConfig[] = [
  // Left Column
  { id: 'copywriting-tips', name: 'Copywriting Tips', icon: <Zap className="h-4 w-4" />, description: 'Analyze and suggest improvements', category: 'enhance' },
  { id: 'keep-writing', name: 'Keep Writing', icon: <PenTool className="h-4 w-4" />, description: 'Continue/expand current content', category: 'generate' },
  { id: 'add-emojis', name: 'Add Emojis', icon: <Smile className="h-4 w-4" />, description: 'Strategic emoji placement', category: 'enhance' },
  { id: 'make-shorter', name: 'Make Shorter', icon: <Scissors className="h-4 w-4" />, description: 'Condense while maintaining impact', category: 'format' },
  { id: 'expand-tweet', name: 'Expand Tweet', icon: <Expand className="h-4 w-4" />, description: 'Convert to thread format', category: 'format' },
  { id: 'create-hook', name: 'Create Hook', icon: <Target className="h-4 w-4" />, description: 'Generate attention-grabbing openers', category: 'generate' },
  { id: 'create-cta', name: 'Create CTA', icon: <Megaphone className="h-4 w-4" />, description: 'Add compelling call-to-actions', category: 'generate' },
  
  // Right Column  
  { id: 'improve-tweet', name: 'Improve Tweet', icon: <TrendingUp className="h-4 w-4" />, description: 'General optimization', category: 'enhance' },
  { id: 'more-assertive', name: 'More Assertive', icon: <Dumbbell className="h-4 w-4" />, description: 'Confident, stronger tone', category: 'tone' },
  { id: 'more-casual', name: 'More Casual', icon: <Coffee className="h-4 w-4" />, description: 'Conversational, relatable tone', category: 'tone' },
  { id: 'more-formal', name: 'More Formal', icon: <Briefcase className="h-4 w-4" />, description: 'Professional, business tone', category: 'tone' },
  { id: 'fix-grammar', name: 'Fix Grammar', icon: <Settings className="h-4 w-4" />, description: 'Correct grammar and spelling', category: 'enhance' },
  { id: 'tweet-ideas', name: 'Tweet Ideas', icon: <Lightbulb className="h-4 w-4" />, description: 'Generate related concepts', category: 'generate' }
];

// Editor Panel Component
const EditorPanel = () => {
  const { 
    state, 
    setCurrentContent, 
     
    setSelectedTool, 
    setIsModalOpen,
    addGeneration,
    applyContent 
  } = useEditorContext();

  const {
    originalTweet,
    currentContent,
    
    
    selectedTool,
    isModalOpen
  } = state;

  const handleContentChange = (value: string) => {
    setCurrentContent(value);
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(currentContent);
      toast.success('Content copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy content');
    }
  };

  const handleSaveContent = () => {
    console.log('Saving content:', currentContent);
    toast.success('Content saved to library!');
  };

  const handleToolSelect = (toolId: string) => {
    setSelectedTool(toolId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTool(null);
  };

  const handleApplyGeneration = (generatedContent: string) => {
    applyContent(generatedContent);
    toast.success('AI generation applied to your tweet!');
  };


  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const selectedToolData = selectedTool ? AI_TOOLS.find(tool => tool.id === selectedTool) : null;

  // Convert local tool ID to AITool enum
  const getAIToolEnum = (toolId: string): AITool => {
    const toolMap: Record<string, AITool> = {
      'copywriting-tips': AITool.CopywritingTips,
      'keep-writing': AITool.KeepWriting,
      'add-emojis': AITool.AddEmojis,
      'make-shorter': AITool.MakeShorter,
      'expand-tweet': AITool.ExpandTweet,
      'create-hook': AITool.CreateHook,
      'create-cta': AITool.CreateCTA,
      'improve-tweet': AITool.ImproveTweet,
      'more-assertive': AITool.MoreAssertive,
      'more-casual': AITool.MoreCasual,
      'more-formal': AITool.MoreFormal,
      'fix-grammar': AITool.FixGrammar,
      'tweet-ideas': AITool.TweetIdeas,
    };
    return toolMap[toolId] || AITool.ImproveTweet;
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="border-b bg-gray-50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Edit className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">AI Tweet Editor</h2>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          Transform your content with AI assistance
        </p>
      </div>


      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Tweet Composer */}
        <div className="flex flex-col p-4">
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900">Your Tweet</h3>
          </div>

          <Textarea
            value={currentContent}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={originalTweet ? "Edit your tweet..." : "Start typing your tweet..."}
            className="resize-none text-sm leading-relaxed border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px] h-48"
          />

          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={handleCopyContent} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" onClick={handleSaveContent} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* AI Tools */}
        <div className="border-t p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Improve your tweet with AI:</h3>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {AI_TOOLS.map((tool) => (
              <Button
                key={tool.id}
                variant="ghost"
                onClick={() => handleToolSelect(tool.id)}
                className={`flex items-center gap-3 justify-start p-2 h-auto text-left rounded-md w-full ${
                  selectedTool === tool.id
                    ? 'bg-blue-100 text-blue-800'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <div className="text-blue-700">{tool.icon}</div>
                <span className="font-medium text-sm">{tool.name}</span>
              </Button>
            ))}
          </div>
        </div>

      </div>

      {/* AI Tool Modal */}
      {selectedToolData && (
        <AIToolModalV2
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          toolName={selectedToolData.name}
          toolIcon={selectedToolData.icon}
          toolDescription={selectedToolData.description}
          toolId={getAIToolEnum(selectedToolData.id)}
          initialContent={currentContent}
          onApply={handleApplyGeneration}
        />
      )}
    </div>
  );
};

const InspirationsPage = () => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [expandedThreads, setExpandedThreads] = useState<Set<string>>(new Set())
  const { setOriginalTweet, setCurrentContent } = useEditorContext()

  const fetchTweets = async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔥 Fetching enhanced inspiration feed...')
      
      const response = await fetch('/api/inspiration/feed?limit=50')
      const data: ApiResponse = await response.json()
      
      if (!response.ok || data.status === 'error') {
        throw new Error(data.error || 'Failed to fetch tweets')
      }
      
      setTweets(data.data.tweets || [])
      setStats(data.data.stats || {})
      
      console.log(`✅ Loaded ${data.data.tweets.length} tweets with ${data.data.stats.inspirationAccounts} inspiration accounts`)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load tweets'
      console.error('❌ Fetch error:', errorMessage)
      setError(errorMessage)
      setTweets([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    fetchTweets()
  }, [])

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  const toggleThread = (tweetId: string) => {
    setExpandedThreads(prev => {
      const newSet = new Set(prev)
      if (newSet.has(tweetId)) {
        newSet.delete(tweetId)
      } else {
        newSet.add(tweetId)
      }
      return newSet
    })
  }

  /**
   * Save tweet to saved content
   */
  const handleSaveTweet = async (tweet: Tweet) => {
    try {
      const userId = "user-placeholder"; // TODO: Replace with actual user ID from auth
      
      const response = await fetch('/api/saved-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          content: tweet.text,
          originalContent: tweet.text,
          toolUsed: 'Saved Tweet',
          chatHistory: [],
          tags: ['inspiration', 'twitter'],
          // Add tweet metadata
          tweetMetadata: {
            id: tweet.id,
            author: tweet.author,
            public_metrics: tweet.public_metrics,
            created_at: tweet.created_at,
            url: `https://twitter.com/${tweet.author.username}/status/${tweet.id}`
          }
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast.success("💾 Tweet saved successfully!");
      } else {
        throw new Error(result.error || 'Failed to save tweet');
      }
    } catch (error) {
      console.error('Save failed:', error);
      toast.error("Failed to save tweet. Please try again.");
    }
  };

  const handleEditTweet = (tweet: Tweet) => {
    // Encode tweet data for URL params
    const tweetData = encodeURIComponent(JSON.stringify({
      id: tweet.id,
      text: tweet.text,
      author: tweet.author,
      public_metrics: tweet.public_metrics,
      created_at: tweet.created_at,
      thread_context: tweet.thread_context
    }))
    
    setOriginalTweet(tweet) // Set original tweet for the editor
    setCurrentContent(tweet.text) // Populate editor with tweet content
    // router.push(`/dashboard/inspirations/editor?tweet=${tweetData}`) // This line is removed as per the new_code
  }

  const renderThreadTweet = (tweet: Tweet, isMain = false, threadPosition?: number) => (
    <div key={tweet.id} className={`${isMain ? '' : 'border-l-2 border-blue-200 pl-4 ml-6 mt-3'}`}>
      {!isMain && threadPosition && (
        <div className="flex items-center gap-2 mb-2">
          <ArrowDown className="h-3 w-3 text-blue-500" />
          <span className="text-xs text-blue-600 font-medium">
            Tweet {threadPosition}
          </span>
        </div>
      )}
      
      <div className="flex items-start gap-3">
        <Image
          src={tweet.author.profile_image_url}
          alt={tweet.author.name}
          width={isMain ? 40 : 32}
          height={isMain ? 40 : 32}
          className={`${isMain ? 'w-10 h-10' : 'w-8 h-8'} rounded-full`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.author.name)}&background=random`;
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className={`font-semibold text-gray-900 truncate ${isMain ? '' : 'text-sm'}`}>
              {tweet.author.name}
            </h3>
            {tweet.author.verified && (
              <div className={`${isMain ? 'w-4 h-4' : 'w-3 h-3'} bg-blue-500 rounded-full flex items-center justify-center`}>
                <svg className={`${isMain ? 'w-3 h-3' : 'w-2 h-2'} text-white`} fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <p className={`text-gray-500 ${isMain ? 'text-sm' : 'text-xs'}`}>@{tweet.author.username}</p>
        </div>
        {isMain && (
          <a
            href={`https://twitter.com/${tweet.author.username}/status/${tweet.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      
      <div className={`${isMain ? 'mt-3' : 'mt-2 ml-11'} space-y-3`}>
        <p className={`text-gray-900 leading-relaxed whitespace-pre-wrap ${isMain ? '' : 'text-sm'}`}>
          {tweet.text}
        </p>
        

      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Panel - Main Content */}
      <div className="flex-1 px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Content Inspiration
              </h1>
              <p className="text-gray-600">
                Discover high-quality content from trending topics and inspiration accounts
              </p>
            </div>
            <div>
              <Button
                onClick={fetchTweets}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Get Fresh Content'}
              </Button>
            </div>
          </div>

          {/* Stats Banner */}
          {stats && !loading && (
            <div className="mt-4">
              <div className="bg-white rounded-lg p-4 border inline-block">
                <div className="text-2xl font-semibold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-500">Total Tweets</div>
              </div>
            </div>
          )}

          {/* No Inspiration Accounts CTA */}
          {stats && !stats.hasInspirationAccounts && !loading && (
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <Users className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Get more variety!</strong> Add inspiration accounts in{' '}
                <a href="/dashboard/settings" className="underline hover:no-underline">
                  Settings
                </a>{' '}
                to see content from your favorite creators and avoid repetitive tweets.
              </AlertDescription>
            </Alert>
          )}

          {/* Too Much Previously Seen Content Warning */}
          {stats && stats.total > 0 && !loading && (
            ((stats.total - stats.unseenCount) / stats.total) > 0.6 && (
              <Alert className="mt-4 border-orange-200 bg-orange-50">
                <RotateCcw className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Lots of repeat content!</strong> You've seen {stats.total - stats.unseenCount} out of {stats.total} tweets. 
                  Refresh the page to get fresh content.
                </AlertDescription>
              </Alert>
            )
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Failed to Load Inspirations
                </h3>
                <p className="text-gray-600 mb-4">
                  {error}
                </p>
              <Button
                onClick={fetchTweets}
                disabled={loading}
                  className="flex items-center gap-2"
              >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Get Fresh Content
              </Button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && tweets.length === 0 && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tweets List */}
        {!loading && !error && tweets.length === 0 && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Content Found
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn&apos;t find any content for your interests right now. 
                  Try adding inspiration accounts in Settings or refresh to get new trending content.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button 
                    onClick={fetchTweets}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh Content
                  </Button>
                  <Button 
                    asChild
                    className="flex items-center gap-2"
                  >
                    <a href="/dashboard/settings">
                      <Users className="h-4 w-4" />
                      Add Inspiration Accounts
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tweets.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-2 gap-3 space-y-3">
            {tweets.map((tweet) => {
              const isThread = tweet.thread_context?.is_thread
              const threadTweets = tweet.thread_context?.thread_tweets || []
              const isExpanded = expandedThreads.has(tweet.id)
              
              return (
                <Card key={tweet.id} className="overflow-hidden hover:shadow-md transition-shadow break-inside-avoid mb-3">
                  {/* Thread Header */}
                  {isThread && (
                    <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Link2 className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Thread ({tweet.thread_context?.total_tweets || 1} tweets)
                          </span>
                          {tweet.thread_context?.thread_position && (
                            <Badge variant="secondary" className="text-xs">
                              #{tweet.thread_context.thread_position}
                            </Badge>
                          )}
                        </div>
                        
                        {threadTweets.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleThread(tweet.id)}
                            className="h-6 px-2 text-blue-600 hover:text-blue-800"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Hide
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                Show All
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-2 pt-4 px-4">
                    {renderThreadTweet(tweet, true)}
                  </CardHeader>
                  
                  <CardContent className="px-4 pb-4 space-y-3">
                    {/* Expanded Thread */}
                    {isThread && isExpanded && threadTweets.length > 1 && (
                      <div className="border-t border-gray-100 pt-3">
                        {threadTweets.slice(1).map((threadTweet, index) => 
                          renderThreadTweet(threadTweet, false, index + 2)
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Heart className="h-4 w-4" />
                          <span>{formatCount(tweet.public_metrics.like_count)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Repeat2 className="h-4 w-4" />
                          <span>{formatCount(tweet.public_metrics.retweet_count)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          <span>{formatCount(tweet.public_metrics.reply_count)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          <span>{formatCount(tweet.public_metrics.impression_count)}</span>
                        </div>
                      </div>
                      
                      <div className="text-xs text-gray-400">
                        {new Date(tweet.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="pt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTweet(tweet)}
                        className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Tweet
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSaveTweet(tweet)}
                        className="flex-1 bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300 transition-colors"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Tweet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Right Panel - Editor */}
      <EditorPanel />
    </div>
  );
};

// Wrapper component with EditorProvider
const InspirationsPageWithProvider = () => {
  return (
    <EditorProvider>
      <InspirationsPage />
    </EditorProvider>
  );
};

export default InspirationsPageWithProvider;

