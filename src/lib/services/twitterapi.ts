// Clean twitterapi.io service layer with proper error handling

import { serverEnv } from '@/config/env.server'
import type { 
  Tweet, 
  TwitterApiSearchResponse, 
  TwitterApiUserResponse, 
  TwitterApiError,
  TwitterApiResponse 
} from '@/lib/types/twitter'

// Base API configuration
const TWITTERAPI_BASE_URL = 'https://api.twitterapi.io'

class TwitterApiService {
  private apiKey: string
  private baseHeaders: Record<string, string>

  constructor() {
    this.apiKey = serverEnv.TWITTERAPI_IO_API_KEY
    this.baseHeaders = {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json',
    }
  }

  // Generic API request handler with error handling
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<TwitterApiResponse<T>> {
    try {
      const url = `${TWITTERAPI_BASE_URL}${endpoint}`
      
      console.log('🌐 Making request to:', url)
      
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.baseHeaders,
          ...options.headers,
        },
      })

      const data = await response.json()
      console.log('📨 Response status:', response.status, 'Data:', JSON.stringify(data, null, 2))

      if (!response.ok) {
        throw new Error(`Twitter API error: ${response.status} - ${data.msg || data.message || 'Unknown error'}`)
      }

      return {
        status: 'success',
        msg: data.msg || data.message || 'Success',
        data,
      }
    } catch (error) {
      console.error('TwitterAPI request failed:', error)
      return {
        status: 'error',
        msg: error instanceof Error ? error.message : 'Unknown error occurred',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get trending tweets from the dedicated trends endpoint (naturally viral content)
  async getTrendingTweetsFromAPI(): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      console.log('🔥 Fetching trending tweets from trends endpoint')
      
      const endpoint = '/twitter/trend/get_trends'
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<Tweet[]>
      }

      // Transform trends to our Tweet format and get the latest tweets for each trend
      const trends = response.data?.trends || []
      console.log(`📈 Found ${trends.length} trends`)
      
      if (trends.length === 0) {
        return {
          status: 'success',
          msg: 'No trends found',
          data: [],
        }
      }

      // Get tweets for the top trending topics
      const trendingTopics = trends.slice(0, 5).map((trend: any) => trend.name || trend.query || trend.topic)
      const validTopics = trendingTopics.filter(Boolean)
      
      console.log('🔍 Searching for tweets from trending topics:', validTopics)
      
      if (validTopics.length === 0) {
        return {
          status: 'success',
          msg: 'No valid trending topics found',
          data: [],
        }
      }

      // Search for tweets using the trending topics with high engagement filters
      return await this.searchHighEngagementTweets(validTopics, 50)
    } catch (error) {
      console.error('Trends API failed:', error)
      return {
        status: 'error',
        msg: 'Failed to fetch trending tweets',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Search for high-engagement tweets with very strict filters
  async searchHighEngagementTweets(
    topics: string[], 
    maxResults: number = 50
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      // Create search query for viral content only
      const query = topics
        .map(topic => {
          const cleanTopic = topic.replace(/\s+/g, ' ').trim()
          return `"${cleanTopic}"`
        })
        .join(' OR ')

      console.log('🔍 High-engagement search query:', query)

      // Very strict parameters for viral content only
      const searchParams = new URLSearchParams({
        query: `${query} -is:retweet lang:en min_faves:1000 min_retweets:200`,
        queryType: 'Top',
        maxResults: Math.min(maxResults, 100).toString(),
      })

      const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<Tweet[]>
      }

      const tweets = this.transformTwitterApiResponse(response.data!)
      const highEngagementTweets = this.filterHighEngagementTweets(tweets)

      console.log(`✅ High-engagement search: ${highEngagementTweets.length} tweets found`)

      return {
        status: 'success',
        msg: `Found ${highEngagementTweets.length} high-impression tweets from trending topics`,
        data: highEngagementTweets,
      }
    } catch (error) {
      console.error('High-engagement search failed:', error)
      return {
        status: 'error',
        msg: 'Failed to search high-engagement tweets',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Updated main search method - multiple strategies with USER TOPICS ONLY
  async searchTweets(
    topics: string[], 
    maxResults: number = 50
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      const allTweets: Tweet[] = []

      // Step 1: Try trends API for naturally viral content related to user topics
      console.log('🚀 Step 1: Trying trends API for user topic-related viral content')
      const trendsResult = await this.getTrendingTweetsFromAPI()
      
      if (trendsResult.status === 'success' && trendsResult.data) {
        allTweets.push(...trendsResult.data)
        console.log(`✅ Added ${trendsResult.data.length} tweets from trends API`)
      }

      // Step 2: Search user topics with very high engagement (10k+ impressions)
      if (allTweets.length < 20) {
        console.log('🔄 Step 2: Searching YOUR topics with high engagement (10k+ impressions)')
        const highEngagementResult = await this.searchHighEngagementTweets(topics, 100)
        
        if (highEngagementResult.status === 'success' && highEngagementResult.data) {
          const newTweets = highEngagementResult.data.filter(tweet => 
            !allTweets.some(existing => existing.id === tweet.id)
          )
          allTweets.push(...newTweets)
          console.log(`✅ Added ${newTweets.length} new tweets from YOUR topics (high engagement)`)
        }
      }

      // Step 3: Search user topics with medium engagement (5k+ impressions)
      if (allTweets.length < 15) {
        console.log('🔄 Step 3: Searching YOUR topics with medium engagement (5k+ impressions)')
        const mediumEngagementResult = await this.searchBroaderEngagement(topics, 100)
        
        if (mediumEngagementResult.status === 'success' && mediumEngagementResult.data) {
          const newTweets = mediumEngagementResult.data.filter(tweet => 
            !allTweets.some(existing => existing.id === tweet.id)
          )
          allTweets.push(...newTweets)
          console.log(`✅ Added ${newTweets.length} new tweets from YOUR topics (medium engagement)`)
        }
      }

      // Step 4: Search individual user topics separately (lower threshold: 2k+ impressions)
      if (allTweets.length < 10) {
        console.log('🔄 Step 4: Searching YOUR topics individually with lower thresholds')
        
        for (const topic of topics.slice(0, 3)) { // Try first 3 topics individually
          if (allTweets.length >= 20) break // Stop if we have enough
          
          console.log(`   🔍 Searching individual topic: "${topic}"`)
          const individualResult = await this.searchIndividualTopic(topic, 30)
          
          if (individualResult.status === 'success' && individualResult.data) {
            const newTweets = individualResult.data.filter(tweet => 
              !allTweets.some(existing => existing.id === tweet.id)
            )
            allTweets.push(...newTweets)
            console.log(`   ✅ Added ${newTweets.length} tweets from "${topic}"`)
          }
        }
      }

      // Remove duplicates and sort by impression count
      const uniqueTweets = Array.from(new Map(allTweets.map(tweet => [tweet.id, tweet])).values())
        .sort((a, b) => (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0))
        .slice(0, 25) // Top 25 tweets max

      console.log(`🎯 Final result: ${uniqueTweets.length} tweets from YOUR topics only`)

      return {
        status: 'success',
        msg: `Found ${uniqueTweets.length} high-engagement tweets from your selected topics`,
        data: uniqueTweets,
      }
      
    } catch (error) {
      console.error('Tweet search failed:', error)
      return {
        status: 'error',
        msg: 'Failed to search tweets',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get trending tweets based on engagement
  async getTrendingTweets(
    topics: string[] = ['startup', 'business', 'tech'],
    limit: number = 20
  ): Promise<TwitterApiResponse<Tweet[]>> {
    return this.searchTweets(topics, limit)
  }

  // Transform twitterapi.io response to our Tweet format with detailed impression debugging
  private transformTwitterApiResponse(response: any): Tweet[] {
    console.log('🔄 Transforming response...')
    
    // Handle different response formats
    let tweets = response.tweets || response.data || []
    
    if (!Array.isArray(tweets)) {
      console.log('❌ No tweets array found in response')
      return []
    }

    console.log(`📊 Processing ${tweets.length} raw tweets...`)

    const transformedTweets = tweets.map((tweet: any, index: number) => {
      const author = tweet.author || {}
      
      // Try multiple fields for impression count (different APIs use different names)
      const impressionCount = tweet.viewCount || 
                             tweet.impression_count || 
                             tweet.impressions || 
                             tweet.view_count ||
                             tweet.public_metrics?.impression_count ||
                             0

      // Log first few tweets in detail to debug impression issues
      if (index < 3) {
        console.log(`🔍 Tweet ${index + 1} raw data:`, {
          id: tweet.id,
          text: tweet.text?.substring(0, 50) + '...',
          viewCount: tweet.viewCount,
          likeCount: tweet.likeCount,
          retweetCount: tweet.retweetCount,
          finalImpressionCount: impressionCount,
        })
      }
      
      const finalTweet = {
        id: tweet.id || 'unknown',
        text: tweet.text || '',
        author: {
          name: author.name || 'Unknown User',
          username: author.userName || author.username || 'unknown',
          profile_image_url: author.profilePicture || author.profile_image_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
          verified: author.isBlueVerified || author.verified || false,
        },
        public_metrics: {
          like_count: tweet.likeCount || tweet.like_count || 0,
          retweet_count: tweet.retweetCount || tweet.retweet_count || 0,
          reply_count: tweet.replyCount || tweet.reply_count || 0,
          impression_count: impressionCount,
        },
        created_at: tweet.createdAt || tweet.created_at || new Date().toISOString(),
      }

      return finalTweet
    })

    // Log impression count summary
    const impressions = transformedTweets.map(t => t.public_metrics.impression_count)
    const validImpressions = impressions.filter(i => i > 0)
    const maxImpression = Math.max(...impressions)
    const avgImpression = validImpressions.length > 0 ? Math.round(validImpressions.reduce((a, b) => a + b, 0) / validImpressions.length) : 0

    console.log(`📈 Impression Summary:`)
    console.log(`   Max: ${maxImpression.toLocaleString()}`)
    console.log(`   Avg: ${avgImpression.toLocaleString()}`)
    console.log(`   Tweets with impressions: ${validImpressions.length}/${transformedTweets.length}`)

    return transformedTweets
  }

  // Filter tweets by impression count - STRICT: Only 10k+ impressions
  private filterHighEngagementTweets(tweets: Tweet[]): Tweet[] {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90) // Extended to 90 days for viral content

    console.log(`📅 Date filter: Only tweets after ${threeMonthsAgo.toISOString()}`)

    // STRICT filtering: Only tweets with 10k+ impressions
    const highImpressionTweets = tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        // Debug each tweet's filtering (only log first 3 to avoid spam)
        const shouldLog = tweets.indexOf(tweet) < 3
        const dateOk = tweetDate >= threeMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 10000
        
        if (shouldLog) {
          console.log(`🔍 Tweet filter debug:`, {
            id: tweet.id,
            text: tweet.text.substring(0, 30) + '...',
            created_at: tweet.created_at,
            tweetDate: tweetDate.toISOString(),
            dateOk,
            impressions: metrics.impression_count,
            impressionOk,
            passes: dateOk && impressionOk
          })
        }
        
        return dateOk && impressionOk
      })
      .sort((a, b) => {
        // Sort by impression count first (highest first)
        return (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0)
      })

    console.log(`🔥 STRICT filtering: ${highImpressionTweets.length} tweets with 10k+ impressions (last 90 days)`)
    
    // Log each qualifying tweet's impression count
    if (highImpressionTweets.length > 0) {
      console.log(`📝 Qualifying tweets:`)
      highImpressionTweets.forEach((tweet, index) => {
        console.log(`   ${index + 1}. ${(tweet.public_metrics.impression_count ?? 0).toLocaleString()} impressions - "${tweet.text.substring(0, 40)}..."`)
      })
    } else {
      console.log(`❌ No tweets found with 10k+ impressions in the last 90 days`)
    }
    
    return highImpressionTweets.slice(0, 15) // Max 15 tweets
  }

  // New broader search method with lower thresholds
  async searchBroaderEngagement(
    topics: string[], 
    maxResults: number = 100
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      const query = topics
        .map(topic => {
          const cleanTopic = topic.replace(/\s+/g, ' ').trim()
          return `"${cleanTopic}"`
        })
        .join(' OR ')

      console.log('🔍 Broader engagement search query:', query)

      // Lower thresholds for broader results
      const searchParams = new URLSearchParams({
        query: `${query} -is:retweet lang:en min_faves:100 min_retweets:20`,
        queryType: 'Top',
        maxResults: maxResults.toString(),
      })

      const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<Tweet[]>
      }

      const tweets = this.transformTwitterApiResponse(response.data!)
      const filteredTweets = this.filterBroaderEngagement(tweets)

      console.log(`✅ Broader search: ${filteredTweets.length} tweets found`)

      return {
        status: 'success',
        msg: `Found ${filteredTweets.length} tweets with broader criteria`,
        data: filteredTweets,
      }
    } catch (error) {
      console.error('Broader engagement search failed:', error)
      return {
        status: 'error',
        msg: 'Failed to search broader engagement tweets',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Broader filter with lower impression threshold
  private filterBroaderEngagement(tweets: Tweet[]): Tweet[] {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90) // 3 months for viral content

    return tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        const dateOk = tweetDate >= threeMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 5000 // Lower threshold: 5k impressions
        
        return dateOk && impressionOk
      })
      .sort((a, b) => (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0))
      .slice(0, 10) // Max 10 from this search
  }

  // New method to search individual topics with lower thresholds
  async searchIndividualTopic(
    topic: string,
    maxResults: number = 30
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      const cleanTopic = topic.replace(/\s+/g, ' ').trim()
      
      // Search individual topic with very low threshold
      const searchParams = new URLSearchParams({
        query: `"${cleanTopic}" -is:retweet lang:en min_faves:50 min_retweets:10`,
        queryType: 'Top',
        maxResults: maxResults.toString(),
      })

      const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<Tweet[]>
      }

      const tweets = this.transformTwitterApiResponse(response.data!)
      const filteredTweets = this.filterLowThreshold(tweets)

      return {
        status: 'success',
        msg: `Found ${filteredTweets.length} tweets for topic: ${topic}`,
        data: filteredTweets,
      }
    } catch (error) {
      console.error(`Individual topic search failed for "${topic}":`, error)
      return {
        status: 'error',
        msg: `Failed to search topic: ${topic}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Filter with very low threshold for individual topics (2k+ impressions)
  private filterLowThreshold(tweets: Tweet[]): Tweet[] {
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 90)

    return tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        const dateOk = tweetDate >= threeMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 2000 // Very low threshold: 2k impressions
        
        return dateOk && impressionOk
      })
      .sort((a, b) => (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0))
      .slice(0, 5) // Max 5 from each individual topic
  }

  // Health check for the API
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/twitter/user/info?userName=twitter')
      return response.status === 'success'
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const twitterApiService = new TwitterApiService()

// Export for testing
export { TwitterApiService } 