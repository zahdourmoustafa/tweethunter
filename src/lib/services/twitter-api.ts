// Twitter API Service
import { Tweet, TwitterApiResponse, ViralTweet, VIRAL_ENGAGEMENT_THRESHOLD, MONTHS_BACK, MAX_VIRAL_TWEETS } from '@/lib/types/training';

export class TwitterApiService {
  private apiKey: string;
  private baseUrl = 'https://api.twitterapi.io';
  private maxViralTweetsLimit: number;

  constructor() {
    this.apiKey = process.env.TWITTERAPI_IO_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TWITTERAPI_IO_API_KEY environment variable is required');
    }
    this.maxViralTweetsLimit = MAX_VIRAL_TWEETS;
  }

  /**
   * Validates if a username exists and is accessible
   */
  async validateUsername(username: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const cleanUsername = this.cleanUsername(username);
      const response = await fetch(`${this.baseUrl}/twitter/user/info?userName=${cleanUsername}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { valid: false, error: 'Username not found. Please check and try again.' };
        }
        if (response.status === 403) {
          return { valid: false, error: 'This account is private. Please try a public creator.' };
        }
        return { valid: false, error: 'Unable to validate username. Please try again later.' };
      }

      const data = await response.json();
      if (data.status === 'error') {
        return { valid: false, error: data.message || 'Username validation failed.' };
      }

      return { valid: true };
    } catch (error) {
      console.error('Username validation error:', error);
      return { valid: false, error: 'Network error. Please check your connection and try again.' };
    }
  }

  /**
   * Fetches viral tweets from a creator
   */
  async fetchViralTweets(username: string): Promise<{ tweets: ViralTweet[]; has_next_page: boolean; next_cursor: string; error?: string }> {
    try {
      const cleanUsername = this.cleanUsername(username);
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - MONTHS_BACK);

      let viralTweets: ViralTweet[] = [];
      let cursor = '';
      let hasNextPage = true;
      let pageCount = 0;
      const maxPages = 50; // Increased to fetch more pages

      // Fetch tweets in pages until we have enough or hit time limit
      while (hasNextPage && pageCount < maxPages && viralTweets.length < this.maxViralTweetsLimit) {
        const response = await this.fetchTweetPage(cleanUsername, cursor);
        
        if (!response.success) {
          return { tweets: [], has_next_page: false, next_cursor: '', error: response.error };
        }

        if (!response.data) {
          return { tweets: [], has_next_page: false, next_cursor: '', error: 'No data received from Twitter API' };
        }

        const currentTweets = response.data.data.tweets;
        
        // Ensure tweets is an array
        if (!Array.isArray(currentTweets)) {
          return { tweets: [], has_next_page: false, next_cursor: '', error: 'Invalid tweet data format received' };
        }

        // Filter tweets by date and viral criteria
        const newViralTweets = currentTweets
          .filter(tweet => {
            if (!tweet || !tweet.createdAt) {
              console.warn('Invalid tweet object:', tweet);
              return false;
            }
            const tweetDate = new Date(tweet.createdAt);
            return tweetDate >= sixMonthsAgo && tweet.viewCount >= VIRAL_ENGAGEMENT_THRESHOLD;
          })
          .map(tweet => ({
            ...tweet,
            totalEngagement: tweet.likeCount + tweet.retweetCount + tweet.replyCount + tweet.quoteCount,
            viralScore: this.calculateViralScore(tweet),
          }));

        // If no recent tweets in this page, we've gone too far back
        if (newViralTweets.length === 0 && currentTweets.length > 0) {
          break;
        }

        console.log(`Page ${pageCount + 1}: currentTweets.length = ${currentTweets.length}, newViralTweets.length = ${newViralTweets.length}`);

        viralTweets.push(...newViralTweets);
        

        hasNextPage = response.data.has_next_page;
        cursor = response.data.next_cursor;
        pageCount++;

        // Add delay to respect rate limits
        await this.delay(100);
      }

      // Sort and slice to the max limit
      viralTweets = viralTweets
        .sort((a, b) => b.totalEngagement - a.totalEngagement) // Sort by totalEngagement
        .slice(0, this.maxViralTweetsLimit);

      if (viralTweets.length === 0) {
        return { 
          tweets: [], 
          has_next_page: false,
          next_cursor: '',
          error: `No tweets found meeting viral criteria (${VIRAL_ENGAGEMENT_THRESHOLD.toLocaleString()}+ views, last ${MONTHS_BACK} months).` 
        };
      }

      return { 
        tweets: viralTweets, 
        has_next_page: hasNextPage,
        next_cursor: cursor,
      };
    } catch (error) {
      console.error('Error fetching viral tweets:', error);
      return { tweets: [], has_next_page: false, next_cursor: '', error: 'Unable to fetch tweets. Please try again later.' };
    }
  }

  /**
   * Fetches a single page of tweets
   */
  private async fetchTweetPage(username: string, cursor: string): Promise<{ success: boolean; data?: TwitterApiResponse; error?: string }> {
    try {
      const params = new URLSearchParams({
        userName: username,
        cursor: cursor,
        includeReplies: 'false', // Focus on original content
      });

      const response = await fetch(`${this.baseUrl}/twitter/user/last_tweets?${params}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: `API request failed with status ${response.status}` };
      }

      const data = await response.json();
      
      // Debug log the response structure
      console.log('Twitter API Response:', JSON.stringify(data, null, 2));
      
      if (data.status === 'error') {
        return { success: false, error: data.message || 'Failed to fetch tweets' };
      }

      const normalizedResponse: TwitterApiResponse = data;

      return { success: true, data: normalizedResponse };
    } catch (error) {
      console.error('Error fetching tweet page:', error);
      return { success: false, error: 'Network error while fetching tweets' };
    }
  }

  

  /**
   * Calculates a viral score based on engagement patterns
   */
  private calculateViralScore(tweet: Tweet): number {
    const { likeCount, retweetCount, replyCount, quoteCount, viewCount } = tweet;
    
    // Weighted scoring - retweets and quotes indicate viral spread
    const retweetWeight = 3;
    const quoteWeight = 2.5;
    const likeWeight = 1;
    const replyWeight = 1.5;
    
    const engagementScore = (
      (retweetCount * retweetWeight) +
      (quoteCount * quoteWeight) +
      (likeCount * likeWeight) +
      (replyCount * replyWeight)
    );

    // Factor in view count if available
    const viewRatio = viewCount > 0 ? engagementScore / viewCount : 0;
    
    return Math.round(engagementScore + (viewRatio * 1000));
  }

  /**
   * Cleans username input (removes @ symbol, trims whitespace)
   */
  private cleanUsername(username: string): string {
    return username.replace('@', '').trim();
  }

  /**
   * Adds delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Gets user info for display purposes
   */
  async getUserInfo(username: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const cleanUsername = this.cleanUsername(username);
      const response = await fetch(`${this.baseUrl}/twitter/user/info?userName=${cleanUsername}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, error: 'Failed to fetch user info' };
      }

      const data = await response.json();
      
      if (data.status === 'error') {
        return { success: false, error: data.message };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return { success: false, error: 'Failed to fetch user info' };
    }
  }

  /**
   * Fetches a tweet thread context
   */
  async fetchTweetThread(tweetId: string): Promise<{ success: boolean; tweets: Tweet[]; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/twitter/tweet/thread_context?tweetId=${tweetId}`, {
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return { success: false, tweets: [], error: `API request failed with status ${response.status}` };
      }

      const data = await response.json();

      if (data.status === 'error') {
        return { success: false, tweets: [], error: data.message || 'Failed to fetch tweet thread' };
      }

      if (!data.data || !Array.isArray(data.data.tweets)) {
        return { success: false, tweets: [], error: 'Invalid thread data format received' };
      }

      return { success: true, tweets: data.data.tweets };
    } catch (error) {
      console.error('Error fetching tweet thread:', error);
      return { success: false, tweets: [], error: 'Network error while fetching tweet thread' };
    }
  }
}
