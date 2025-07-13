/**
 * TwitterAPI.io Integration Service
 * Handles fetching Twitter data for voice analysis
 */

interface TwitterUser {
  id: string;
  userName: string;
  name: string;
  description?: string;
  isBlueVerified: boolean;
  followers: number;
  following: number;
  statusesCount: number;
  profilePicture?: string;
}

// TwitterAPI.io tweet structure (from documentation)
interface TwitterApiTweet {
  type: string;
  id: string;
  url: string;
  text: string;
  source: string;
  retweetCount: number;
  replyCount: number;
  likeCount: number;
  quoteCount: number;
  viewCount?: number;
  createdAt: string;
  lang?: string;
  bookmarkCount?: number;
  isReply: boolean;
  inReplyToId?: string;
  conversationId?: string;
  inReplyToUserId?: string;
  inReplyToUsername?: string;
  author: {
    type: string;
    userName: string;
    url: string;
    id: string;
    name: string;
    isBlueVerified: boolean;
    verifiedType?: string;
    profilePicture?: string;
  };
}

// Our internal tweet structure (compatible with existing code)
interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  public_metrics: {
    retweet_count: number;
    like_count: number;
    reply_count: number;
    quote_count: number;
  };
  referenced_tweets?: Array<{
    type: 'retweeted' | 'quoted' | 'replied_to';
    id: string;
  }>;
  context_annotations?: Array<{
    domain: {
      id: string;
      name: string;
      description: string;
    };
    entity: {
      id: string;
      name: string;
      description: string;
    };
  }>;
}

interface TwitterApiResponse<T> {
  data?: T;
  status: 'success' | 'error';
  msg?: string;
  message?: string;
  code?: number;
  // For tweets endpoint - tweets are in data array
  tweets?: TwitterApiTweet[];
  has_next_page?: boolean;
  next_cursor?: string;
  meta?: {
    result_count: number;
    next_token?: string;
  };
  error?: number;
}

export class TwitterApiService {
  private baseURL = 'https://api.twitterapi.io';
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.TWITTERAPI_IO_API_KEY!;
    if (!this.apiKey) {
      throw new Error('TWITTERAPI_IO_API_KEY environment variable is required');
    }
  }

  private async makeRequest<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value.toString());
    });

    console.log(`Making TwitterAPI.io request to: ${url.toString()}`);

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'X-API-Key': this.apiKey, // Correct header format from documentation
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`TwitterAPI.io request failed:`, {
          url: url.toString(),
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        // Create a more specific error with status code
        const error = new Error(`TwitterAPI.io request failed: ${response.status} ${response.statusText} - ${errorText}`);
        (error as any).status = response.status;
        (error as any).statusText = response.statusText;
        throw error;
      }

      const data = await response.json();
      console.log(`TwitterAPI.io response:`, { endpoint, dataKeys: Object.keys(data) });
      return data;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Network or parsing error:`, error.message);
      }
      throw error;
    }
  }

  /**
   * Convert TwitterAPI.io tweet format to our internal format
   */
  private convertTweetFormat(apiTweet: TwitterApiTweet): Tweet {
    const tweet: Tweet = {
      id: apiTweet.id,
      text: apiTweet.text,
      created_at: apiTweet.createdAt,
      author_id: apiTweet.author.id,
      public_metrics: {
        retweet_count: apiTweet.retweetCount || 0,
        like_count: apiTweet.likeCount || 0,
        reply_count: apiTweet.replyCount || 0,
        quote_count: apiTweet.quoteCount || 0,
      },
    };

    // Add referenced tweets if it's a reply
    if (apiTweet.isReply && apiTweet.inReplyToId) {
      tweet.referenced_tweets = [{
        type: 'replied_to',
        id: apiTweet.inReplyToId,
      }];
    }

    return tweet;
  }

  /**
   * Test API connectivity and key validity
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      // Try to validate a well-known Twitter account to test the API
      const result = await this.validateAccount('twitter');
      if (result.exists || result.isPublic !== undefined) {
        return { success: true };
      }
      return { 
        success: false, 
        error: 'API key appears to be invalid or service is unavailable' 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { 
        success: false, 
        error: `API connection test failed: ${errorMessage}` 
      };
    }
  }

  /**
   * Validate if a Twitter account exists and is accessible
   */
  async validateAccount(username: string): Promise<{ exists: boolean; isPublic: boolean; user?: TwitterUser }> {
    try {
      const cleanUsername = username.replace('@', '');
      
      // Use correct endpoint from documentation
      const response = await this.makeRequest<TwitterApiResponse<TwitterUser>>('/twitter/user/info', {
        userName: cleanUsername,
      });

      // Check for error response
      if (response.status === 'error' || response.error) {
        console.log(`User ${cleanUsername} not found or error:`, response.message || response.msg);
        return { exists: false, isPublic: false };
      }

      if (response.data) {
        return {
          exists: true,
          isPublic: true, // TwitterAPI.io only returns public accounts
          user: response.data,
        };
      }

      return { exists: false, isPublic: false };
    } catch (error) {
      console.error('Error validating Twitter account:', error);
      
      // If it's a 404, the account doesn't exist or is private
      if (error instanceof Error && error.message.includes('404')) {
        return { exists: false, isPublic: false };
      }
      
      // For other errors, we can't determine the account status
      throw error;
    }
  }

  /**
   * Fetch user's timeline tweets for voice analysis with advanced filtering
   */
  async fetchUserTweets(username: string, count: number = 200): Promise<Tweet[]> {
    try {
      const cleanUsername = username.replace('@', '');
      
      const userValidation = await this.validateAccount(cleanUsername);
      if (!userValidation.exists || !userValidation.user) {
        throw new Error(`User @${cleanUsername} not found`);
      }

      let allTweets: TwitterApiTweet[] = [];
      let cursor: string | undefined;
      let hasNextPage = true;
      const maxPages = 10; // Limit to 10 pages (up to 200 tweets) to avoid excessive API calls
      let pagesFetched = 0;

      while (allTweets.length < count && hasNextPage && pagesFetched < maxPages) {
        const params: Record<string, string | number> = {
          userName: cleanUsername,
          includeReplies: 'false',
        };
        if (cursor) {
          params.cursor = cursor;
        }

        const response = await this.makeRequest<TwitterApiResponse<{ tweets: TwitterApiTweet[] }>>('/twitter/user/last_tweets', params);
        pagesFetched++;

        if (response.status === 'error' || response.code) {
          console.warn(`Failed to fetch a page of tweets: ${response.message || response.msg}`);
          break; 
        }

        const fetchedTweets = (response.data as any)?.tweets || response.tweets || [];
        
        if (fetchedTweets.length > 0) {
          allTweets.push(...fetchedTweets);
        }

        hasNextPage = response.has_next_page || false;
        cursor = response.next_cursor;

        if (!hasNextPage) {
          break;
        }
      }

      console.log(`Found ${allTweets.length} total tweets to process from ${pagesFetched} pages`);

      if (allTweets.length === 0) {
        console.log('No tweets found after fetching all pages.');
        return [];
      }

      const convertedTweets = allTweets.map(tweet => this.convertTweetFormat(tweet));
      const filteredTweets = this.filterTweetsForVoiceAnalysis(convertedTweets);

      console.log(`After filtering: ${filteredTweets.length} tweets remaining`);

      return filteredTweets.slice(0, count);
    } catch (error) {
      console.error('Error fetching user tweets:', error);
      throw error;
    }
  }

  /**
   * Advanced filtering logic for voice analysis quality
   */
  private filterTweetsForVoiceAnalysis(tweets: Tweet[]): Tweet[] {
    return tweets.filter(tweet => {
      // Skip if it's a retweet (double check)
      if (tweet.referenced_tweets?.some(ref => ref.type === 'retweeted')) {
        return false;
      }
      
      // Skip if it starts with @mention (likely a reply)
      if (tweet.text.startsWith('@')) {
        return false;
      }

      // Skip very short tweets (less than 10 characters)
      if (tweet.text.length < 10) {
        return false;
      }

      // Skip tweets that are mostly URLs
      const urlPattern = /https?:\/\/[^\s]+/g;
      const urlMatches = tweet.text.match(urlPattern) || [];
      const urlLength = urlMatches.reduce((sum, url) => sum + url.length, 0);
      if (urlLength > tweet.text.length * 0.5) {
        return false;
      }

      // Skip tweets that are mostly hashtags
      const hashtagPattern = /#\w+/g;
      const hashtagMatches = tweet.text.match(hashtagPattern) || [];
      if (hashtagMatches.length > 5) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by engagement to prioritize higher quality tweets
      const engagementA = a.public_metrics.like_count + a.public_metrics.retweet_count;
      const engagementB = b.public_metrics.like_count + b.public_metrics.retweet_count;
      return engagementB - engagementA;
    });
  }

  /**
   * Get user information by username
   */
  async getUserInfo(username: string): Promise<TwitterUser | null> {
    try {
      const validation = await this.validateAccount(username);
      return validation.user || null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }

  /**
   * Analyze tweet patterns for voice modeling
   */
  analyzeTweetPatterns(tweets: Tweet[]): {
    averageLength: number;
    usesThreads: boolean;
    threadFrequency: number;
    commonPatterns: string[];
    engagementMetrics: {
      averageLikes: number;
      averageRetweets: number;
      averageReplies: number;
    };
  } {
    if (tweets.length === 0) {
      return {
        averageLength: 0,
        usesThreads: false,
        threadFrequency: 0,
        commonPatterns: [],
        engagementMetrics: {
          averageLikes: 0,
          averageRetweets: 0,
          averageReplies: 0,
        },
      };
    }

    // Calculate average tweet length
    const totalLength = tweets.reduce((sum, tweet) => sum + tweet.text.length, 0);
    const averageLength = Math.round(totalLength / tweets.length);

    // Detect thread patterns (tweets that end with numbers or "1/", "2/", etc.)
    const threadTweets = tweets.filter(tweet => 
      /\d+\/\d*$/.test(tweet.text.trim()) || 
      /\(\d+\/\d+\)$/.test(tweet.text.trim())
    );
    const usesThreads = threadTweets.length > 0;
    const threadFrequency = Math.round((threadTweets.length / tweets.length) * 100);

    // Extract common patterns
    const commonPatterns: string[] = [];
    
    // Check for question patterns
    const questionTweets = tweets.filter(tweet => tweet.text.includes('?'));
    if (questionTweets.length > tweets.length * 0.2) {
      commonPatterns.push('frequently_asks_questions');
    }

    // Check for emoji usage
    const emojiTweets = tweets.filter(tweet => /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(tweet.text));
    if (emojiTweets.length > tweets.length * 0.3) {
      commonPatterns.push('uses_emojis_frequently');
    }

    // Check for bullet points or lists
    const listTweets = tweets.filter(tweet => 
      tweet.text.includes('•') || 
      tweet.text.includes('-') || 
      /^\d+\./.test(tweet.text.trim())
    );
    if (listTweets.length > tweets.length * 0.15) {
      commonPatterns.push('uses_lists_or_bullets');
    }

    // Calculate engagement metrics
    const totalLikes = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.like_count, 0);
    const totalRetweets = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.retweet_count, 0);
    const totalReplies = tweets.reduce((sum, tweet) => sum + tweet.public_metrics.reply_count, 0);

    const engagementMetrics = {
      averageLikes: Math.round(totalLikes / tweets.length),
      averageRetweets: Math.round(totalRetweets / tweets.length),
      averageReplies: Math.round(totalReplies / tweets.length),
    };

    return {
      averageLength,
      usesThreads,
      threadFrequency,
      commonPatterns,
      engagementMetrics,
    };
  }
}

// Export singleton instance
export const twitterApiService = new TwitterApiService();

// Export types
export type { TwitterUser, Tweet, TwitterApiResponse };
