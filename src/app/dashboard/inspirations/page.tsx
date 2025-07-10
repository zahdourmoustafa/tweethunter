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
  Eye
} from "lucide-react";

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
}

interface ApiResponse {
  tweets: Tweet[];
  source: string;
  count: number;
  message?: string;
  error?: string;
  warning?: string;
}

const InspirationsPage = () => {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [source, setSource] = useState<string>('')

  const fetchTweets = async (nocache = false) => {
    try {
      setLoading(true)
      setError(null)
      setWarning(null)
      
      const params = new URLSearchParams({
        ...(nocache && { nocache: 'true' })
      })
      
      console.log('🔍 Fetching global tweets...')
      
      const response = await fetch(`/api/twitter/feed?${params}`)
      const data: ApiResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tweets')
      }
      
      setTweets(data.tweets || [])
      setSource(data.source || '')
      
      if (data.warning) {
        setWarning(data.warning)
      }
      
      console.log(`✅ Loaded ${data.count} tweets from ${data.source}`)
      
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

  const handleRetry = async () => {
    await fetchTweets(true) // Force fresh fetch
  }

  const formatCount = (count: number): string => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
    return count.toString()
  }

  // Source info for display
  const sourceInfo = {
    'global-fresh': { label: 'Global • Fresh', color: 'bg-green-600', icon: Globe },
    'global-cached': { label: 'Global • Cached', color: 'bg-blue-600', icon: Globe },
    'error': { label: 'Error', color: 'bg-red-600', icon: AlertTriangle },
  }

  const currentSourceInfo = sourceInfo[source as keyof typeof sourceInfo] || { 
    label: 'Unknown', 
    color: 'bg-gray-600',
    icon: Wifi
  }
  const SourceIcon = currentSourceInfo.icon

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Tweet Inspirations</h1>
              <p className="text-muted-foreground mt-1">
                Discover viral content from across Twitter
              </p>
            </div>
          </div>

          {/* Source Info */}
          {source && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-sm ${currentSourceInfo.color}`}>
                  <SourceIcon className="h-4 w-4" />
                  <span>{currentSourceInfo.label}</span>
                </div>
                {tweets.length > 0 && (
                  <Badge variant="secondary">{tweets.length} tweets</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetry}
                  disabled={loading}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Warning Message */}
        {warning && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {warning}
            </AlertDescription>
          </Alert>
        )}

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
                onClick={handleRetry}
                disabled={loading}
                  className="flex items-center gap-2"
              >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Try Again
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
                  No Inspirations Found
                </h3>
                <p className="text-gray-600 mb-4">
                  We couldn&apos;t find any trending tweets for your interests right now. 
                  Try refreshing or updating your topics in settings.
                </p>
                <Button 
                  onClick={handleRetry}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        )}

        {tweets.length > 0 && (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-3 space-y-3">
            {tweets.map((tweet) => (
              <Card key={tweet.id} className="overflow-hidden hover:shadow-md transition-shadow break-inside-avoid mb-3">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-start gap-3">
                    <Image
                      src={tweet.author.profile_image_url}
                      alt={tweet.author.name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.author.name)}&background=random`;
                      }}
                    />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {tweet.author.name}
                        </h3>
                          {tweet.author.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">@{tweet.author.username}</p>
                    </div>
                    <a
                      href={`https://twitter.com/${tweet.author.username}/status/${tweet.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {tweet.text}
                  </p>
                  
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationsPage;

