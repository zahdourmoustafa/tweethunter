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

  // Make request to TwitterAPI.io - made public for testing
  async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<TwitterApiResponse<T>> {
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

      // Reduced parameters for broader viral content
      const searchParams = new URLSearchParams({
        query: `${query} -is:retweet lang:en min_faves:50 min_retweets:10`,
        queryType: 'Top',
        maxResults: '100',
        expansions: 'referenced_tweets.id,referenced_tweets.id.author_id,author_id',
        'tweet.fields': 'conversation_id,in_reply_to_user_id,referenced_tweets,created_at,public_metrics',
        'user.fields': 'name,username,profile_image_url,verified',
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

      // Step 2: Search user topics with high engagement (1k+ impressions) - ALWAYS run
      console.log('🔄 Step 2: Searching YOUR topics with high engagement (1k+ impressions)')
      const highEngagementResult = await this.searchHighEngagementTweets(topics, 100)
      
      if (highEngagementResult.status === 'success' && highEngagementResult.data) {
        const newTweets = highEngagementResult.data.filter(tweet => 
          !allTweets.some(existing => existing.id === tweet.id)
        )
        allTweets.push(...newTweets)
        console.log(`✅ Added ${newTweets.length} new tweets from YOUR topics (high engagement)`)
      }

      // Step 3: Search user topics with medium engagement (500+ impressions) - ALWAYS run
      console.log('🔄 Step 3: Searching YOUR topics with medium engagement (500+ impressions)')
      const mediumEngagementResult = await this.searchBroaderEngagement(topics, 100)
      
      if (mediumEngagementResult.status === 'success' && mediumEngagementResult.data) {
        const newTweets = mediumEngagementResult.data.filter(tweet => 
          !allTweets.some(existing => existing.id === tweet.id)
        )
        allTweets.push(...newTweets)
        console.log(`✅ Added ${newTweets.length} new tweets from YOUR topics (medium engagement)`)
      }

      // Step 4: Search individual user topics separately (lower threshold: 200+ impressions) - ALWAYS run
      console.log('🔄 Step 4: Searching YOUR topics individually with lower thresholds')
        
      for (const topic of topics.slice(0, 5)) { // Try first 5 topics individually (increased from 3)
        if (allTweets.length >= 50) break // Stop if we have more than enough
        
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

      // Step 5: If still not enough, do a very broad search with minimal requirements
      if (allTweets.length < 30) {
        console.log('🔄 Step 5: Very broad search with minimal requirements')
        
        for (const topic of topics.slice(0, 3)) {
          if (allTweets.length >= 40) break
          
          console.log(`   🔍 Broad search for: "${topic}"`)
          const broadResult = await this.searchVeryBroadTopic(topic, 50)
          
          if (broadResult.status === 'success' && broadResult.data) {
            const newTweets = broadResult.data.filter(tweet => 
              !allTweets.some(existing => existing.id === tweet.id)
            )
            allTweets.push(...newTweets)
            console.log(`   ✅ Added ${newTweets.length} tweets from broad search: "${topic}"`)
          }
        }
      }

      // Remove duplicates and sort by date (newest first), then by impression count
      const uniqueTweets = Array.from(new Map(allTweets.map(tweet => [tweet.id, tweet])).values())
        .sort((a, b) => {
          // Primary sort: by date (newest first)
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          if (dateB !== dateA) return dateB - dateA
          
          // Secondary sort: by impression count (highest first)
          return (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0)
        })
        .slice(0, 50) // Top 50 tweets max (ensuring 30+ as requested)

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
    // Media lookup removed per user request
    
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
      
      // Media processing removed per user request

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
        // Thread/conversation context
        ...(tweet.conversation_id && { conversation_id: tweet.conversation_id }),
        ...(tweet.in_reply_to_user_id && { in_reply_to_user_id: tweet.in_reply_to_user_id }),
        ...(tweet.referenced_tweets && { 
          referenced_tweets: tweet.referenced_tweets 
        }),
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

  // Transform TwitterAPI.io advanced search response format to our Tweet interface
  private transformTweetFromTwitterApiIo(tweet: any): Tweet {
    console.log(`🔄 Transforming advanced search tweet:`, {
      id: tweet.id,
      text: tweet.text?.substring(0, 50) + '...',
      author: tweet.author,
      likeCount: tweet.likeCount,
      viewCount: tweet.viewCount,
      retweetCount: tweet.retweetCount
    })

    // Handle author field - advanced search returns different format
    let authorData
    if (typeof tweet.author === 'string') {
      // Advanced search returns author as string username
      authorData = {
        name: tweet.author,
        username: tweet.author,
        profile_image_url: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
        verified: false
      }
    } else if (typeof tweet.author === 'object' && tweet.author !== null) {
      // Regular format with author object
      authorData = {
        name: tweet.author.name || tweet.author.userName || 'Unknown User',
        username: tweet.author.userName || tweet.author.username || 'unknown',
        profile_image_url: tweet.author.profilePicture || tweet.author.profile_image_url || 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
        verified: tweet.author.isBlueVerified || tweet.author.verified || false
      }
    } else {
      // Fallback
      authorData = {
        name: 'Unknown User',
        username: 'unknown',
        profile_image_url: 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png',
        verified: false
      }
    }

    // Handle metrics - try multiple field names
    const impressionCount = tweet.viewCount || 
                           tweet.impression_count || 
                           tweet.impressions || 
                           tweet.view_count ||
                           tweet.public_metrics?.impression_count ||
                           0

    const likeCount = tweet.likeCount || tweet.like_count || tweet.public_metrics?.like_count || 0
    const retweetCount = tweet.retweetCount || tweet.retweet_count || tweet.public_metrics?.retweet_count || 0  
    const replyCount = tweet.replyCount || tweet.reply_count || tweet.public_metrics?.reply_count || 0

    const transformedTweet = {
      id: tweet.id || 'unknown',
      text: tweet.text || '',
      author: authorData,
      public_metrics: {
        like_count: likeCount,
        retweet_count: retweetCount,
        reply_count: replyCount,
        impression_count: impressionCount,
      },
      created_at: tweet.createdAt || tweet.created_at || new Date().toISOString(),
      // Thread/conversation context
      ...(tweet.conversation_id && { conversation_id: tweet.conversation_id }),
      ...(tweet.in_reply_to_user_id && { in_reply_to_user_id: tweet.in_reply_to_user_id }),
      ...(tweet.referenced_tweets && { referenced_tweets: tweet.referenced_tweets }),
    }

    console.log(`✅ Transformed tweet:`, {
      id: transformedTweet.id,
      author: transformedTweet.author.username,
      likes: transformedTweet.public_metrics.like_count,
      impressions: transformedTweet.public_metrics.impression_count
    })

    return transformedTweet
  }

  // Filter tweets by impression count - Updated: 2k+ impressions for 6 months
  private filterHighEngagementTweets(tweets: Tweet[]): Tweet[] {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180) // Extended to 180 days (6 months)

    console.log(`📅 Date filter: Only tweets after ${sixMonthsAgo.toISOString()}`)

    // Updated filtering: tweets with 2k+ impressions (reduced from 10k)
    const highImpressionTweets = tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        // Debug each tweet's filtering (only log first 3 to avoid spam)
        const shouldLog = tweets.indexOf(tweet) < 3
        const dateOk = tweetDate >= sixMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 1000 // Reduced from 2000 to get more results
        
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

    console.log(`🔥 Updated filtering: ${highImpressionTweets.length} tweets with 1k+ impressions (last 6 months)`)
    
    // Log each qualifying tweet's impression count
    if (highImpressionTweets.length > 0) {
      console.log(`📝 Qualifying tweets:`)
      highImpressionTweets.forEach((tweet, index) => {
        console.log(`   ${index + 1}. ${(tweet.public_metrics.impression_count ?? 0).toLocaleString()} impressions - "${tweet.text.substring(0, 40)}..."`)
      })
    } else {
      console.log(`❌ No tweets found with 1k+ impressions in the last 6 months`)
    }
    
    return highImpressionTweets.slice(0, 20) // Max 20 tweets (increased from 15)
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

      // Much lower thresholds for broader results
      const searchParams = new URLSearchParams({
        query: `${query} -is:retweet lang:en min_faves:20 min_retweets:5`,
        queryType: 'Top',
        maxResults: '100',
        expansions: 'referenced_tweets.id,referenced_tweets.id.author_id,author_id',
        'tweet.fields': 'conversation_id,in_reply_to_user_id,referenced_tweets,created_at,public_metrics',
        'user.fields': 'name,username,profile_image_url,verified',
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
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180) // 6 months for viral content

    return tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        const dateOk = tweetDate >= sixMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 500 // Lower threshold: 500 impressions
        
        return dateOk && impressionOk
      })
      .sort((a, b) => {
        // Primary sort by date (newest first)
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        if (dateB !== dateA) return dateB - dateA
        
        // Secondary sort by impression count
        return (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0)
      })
      .slice(0, 15) // Max 15 from this search (increased from 10)
  }

  // New method to search individual topics with lower thresholds
  async searchIndividualTopic(
    topic: string,
    maxResults: number = 30
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      const cleanTopic = topic.replace(/\s+/g, ' ').trim()
      
      // Search individual topic with minimal threshold
      const searchParams = new URLSearchParams({
        query: `"${cleanTopic}" -is:retweet lang:en min_faves:10 min_retweets:2`,
        queryType: 'Top',
        maxResults: '50',
        expansions: 'referenced_tweets.id,referenced_tweets.id.author_id,author_id',
        'tweet.fields': 'conversation_id,in_reply_to_user_id,referenced_tweets,created_at,public_metrics',
        'user.fields': 'name,username,profile_image_url,verified',
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

  // Filter with very low threshold for individual topics (500+ impressions)
  private filterLowThreshold(tweets: Tweet[]): Tweet[] {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

    return tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        const dateOk = tweetDate >= sixMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 200 // Very low threshold: 200 impressions
        
        return dateOk && impressionOk
      })
      .sort((a, b) => {
        // Primary sort by date (newest first)
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        if (dateB !== dateA) return dateB - dateA
        
        // Secondary sort by impression count
        return (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0)
      })
      .slice(0, 8) // Max 8 from each individual topic (increased from 5)
  }

  // New method for very broad search with minimal requirements
  async searchVeryBroadTopic(
    topic: string,
    maxResults: number = 50
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      const cleanTopic = topic.replace(/\s+/g, ' ').trim()
      
      // Very broad search with minimal requirements
      const searchParams = new URLSearchParams({
        query: `"${cleanTopic}" -is:retweet lang:en min_faves:5`,
        queryType: 'Top',
        maxResults: '50',
        expansions: 'referenced_tweets.id,referenced_tweets.id.author_id,author_id',
        'tweet.fields': 'conversation_id,in_reply_to_user_id,referenced_tweets,created_at,public_metrics',
        'user.fields': 'name,username,profile_image_url,verified',
      })

      const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<Tweet[]>
      }

      const tweets = this.transformTwitterApiResponse(response.data!)
      const filteredTweets = this.filterVeryBroadThreshold(tweets)

      return {
        status: 'success',
        msg: `Found ${filteredTweets.length} tweets for broad topic: ${topic}`,
        data: filteredTweets,
      }
    } catch (error) {
      console.error(`Very broad topic search failed for "${topic}":`, error)
      return {
        status: 'error',
        msg: `Failed to search broad topic: ${topic}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Filter with very broad threshold (100+ impressions)
  private filterVeryBroadThreshold(tweets: Tweet[]): Tweet[] {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

    return tweets
      .filter(tweet => {
        const tweetDate = new Date(tweet.created_at)
        const metrics = tweet.public_metrics
        
        const dateOk = tweetDate >= sixMonthsAgo
        const impressionOk = (metrics.impression_count ?? 0) >= 100 // Very broad threshold: 100 impressions
        
        return dateOk && impressionOk
      })
      .sort((a, b) => {
        // Primary sort by date (newest first)
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        if (dateB !== dateA) return dateB - dateA
        
        // Secondary sort by impression count
        return (b.public_metrics.impression_count ?? 0) - (a.public_metrics.impression_count ?? 0)
      })
      .slice(0, 10) // Max 10 from each very broad search
  }

  // Fetch complete thread context for a tweet
  async fetchThreadContext(conversationId: string): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      console.log(`🧵 Fetching thread context for conversation: ${conversationId}`)
      
      const searchParams = new URLSearchParams({
        query: `conversation_id:${conversationId}`,
        queryType: 'Recent',
        maxResults: '50',
        expansions: 'referenced_tweets.id,referenced_tweets.id.author_id,author_id',
        'tweet.fields': 'conversation_id,in_reply_to_user_id,referenced_tweets,created_at,public_metrics',
        'user.fields': 'name,username,profile_image_url,verified',
      })

      const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        console.log(`❌ Failed to fetch thread context: ${response.msg}`)
        return response as TwitterApiResponse<Tweet[]>
      }

      const threadTweets = this.transformTwitterApiResponse(response.data!)
      
      // Sort tweets chronologically to build proper thread order
      const sortedThreadTweets = threadTweets
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

      console.log(`🧵 Found ${sortedThreadTweets.length} tweets in thread`)

      return {
        status: 'success',
        msg: `Found ${sortedThreadTweets.length} tweets in thread`,
        data: sortedThreadTweets,
      }
    } catch (error) {
      console.error(`Thread fetch failed for conversation ${conversationId}:`, error)
      return {
        status: 'error',
        msg: 'Failed to fetch thread context',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Enhanced search that includes thread context for tweets
  async searchTweetsWithThreads(
    topics: string[], 
    maxResults: number = 50
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      // First get regular tweets
      const tweetResults = await this.searchTweets(topics, maxResults)
      
      if (tweetResults.status === 'error' || !tweetResults.data) {
        return tweetResults
      }

      const tweetsWithThreads: Tweet[] = []
      
      for (const tweet of tweetResults.data) {
        // Check if tweet is part of a thread
        if (tweet.conversation_id && (tweet.in_reply_to_user_id || tweet.referenced_tweets)) {
          console.log(`🧵 Tweet ${tweet.id} is part of a thread, fetching context...`)
          
          // Fetch thread context
          const threadResult = await this.fetchThreadContext(tweet.conversation_id)
          
          if (threadResult.status === 'success' && threadResult.data) {
            // Add thread context to the tweet
            const threadContext = {
              is_thread: true,
              thread_position: threadResult.data.findIndex(t => t.id === tweet.id) + 1,
              total_tweets: threadResult.data.length,
              thread_tweets: threadResult.data
            }
            
            tweetsWithThreads.push({
              ...tweet,
              thread_context: threadContext
            })
          } else {
            // If thread fetch fails, add tweet without thread context
            tweetsWithThreads.push({
              ...tweet,
              thread_context: {
                is_thread: false
              }
            })
          }
        } else {
          // Regular single tweet
          tweetsWithThreads.push({
            ...tweet,
            thread_context: {
              is_thread: false
            }
          })
        }
      }

      console.log(`🎯 Enhanced search complete: ${tweetsWithThreads.length} tweets (with thread context)`)

      return {
        status: 'success',
        msg: `Found ${tweetsWithThreads.length} tweets with thread context`,
        data: tweetsWithThreads,
      }
    } catch (error) {
      console.error('Enhanced thread search failed:', error)
      return {
        status: 'error',
        msg: 'Failed to search tweets with thread context',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // ===== INSPIRATION ACCOUNTS METHODS =====
  
  // Get user profile by username for inspiration account validation
  async getUserByUsername(username: string): Promise<TwitterApiResponse<any>> {
    try {
      const cleanUsername = username.replace('@', '').trim()
      console.log(`👤 Fetching user profile for: ${cleanUsername}`)
      
      const endpoint = `/twitter/user/info?userName=${cleanUsername}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response
      }

      console.log(`✅ Successfully fetched profile for @${cleanUsername}`)
      return response
    } catch (error) {
      console.error(`Failed to fetch user profile for ${username}:`, error)
      return {
        status: 'error',
        msg: `Failed to fetch user profile: ${username}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get high-performing tweets from a specific user using advanced search
  async getUserLastTweets(username: string, maxResults: number = 50): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      const cleanUsername = username.replace('@', '').trim()
      console.log(`🔥 ADVANCED SEARCH: Getting TOP tweets from @${cleanUsername}`)
      
      // Use advanced search with from:username syntax to get high-performing tweets
      const searchParams = new URLSearchParams({
        query: `from:${cleanUsername}`, // Get tweets specifically from this user
        queryType: 'Top', // Get high-engagement tweets, not chronological
        cursor: '' // First page
      })

      const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
      console.log(`🔗 Advanced search endpoint: https://api.twitterapi.io${endpoint}`)
      
      const response = await this.makeRequest<any>(endpoint)
      console.log(`📡 Advanced search response for @${cleanUsername}:`, {
        status: response.status,
        dataKeys: response.data ? Object.keys(response.data) : 'no data',
        tweetsLength: response.data?.tweets?.length || 0,
        error: response.error,
        msg: response.msg
      })
      
      if (response.status === 'error') {
        console.log(`❌ Advanced search failed for @${cleanUsername}:`, {
          error: response.error,
          msg: response.msg,
          fullResponse: response
        })
        
        // Return empty result instead of error to prevent breaking the entire flow
        return {
          status: 'success',
          data: [],
          msg: `Advanced search failed for @${cleanUsername}: ${response.error || response.msg}`
        } as TwitterApiResponse<Tweet[]>
      }

      // Check if we have tweets data  
      const tweetsData = response.data?.tweets || []
      console.log(`📊 Advanced search returned ${tweetsData.length} raw tweets from @${cleanUsername}`)
      
      if (tweetsData.length === 0) {
        console.log(`⚠️ No TOP tweets found for @${cleanUsername} - this could mean:`)
        console.log(`   - Account doesn't exist or is private`)
        console.log(`   - Account has no high-engagement tweets`)
        console.log(`   - API access issue`)
        return {
          status: 'success',
          data: [],
          msg: `No high-performing tweets found for @${cleanUsername}`
        } as TwitterApiResponse<Tweet[]>
      }

      // Log sample of raw data
      if (tweetsData.length > 0) {
        console.log(`📄 Sample raw tweet from @${cleanUsername}:`, {
          id: tweetsData[0]?.id,
          text: tweetsData[0]?.text?.substring(0, 50) + '...',
          likeCount: tweetsData[0]?.likeCount,
          viewCount: tweetsData[0]?.viewCount,
          author: tweetsData[0]?.author?.userName
        })
      }

      // Transform TwitterAPI.io format to our Tweet interface
      const tweets: Tweet[] = tweetsData.slice(0, maxResults).map((tweet: any) => 
        this.transformTweetFromTwitterApiIo(tweet)
      )

      console.log(`🔄 Transformed ${tweets.length} tweets from @${cleanUsername}`)

      // Filter for truly high-performing tweets (since we're using 'Top' query)
      const highPerformingTweets = tweets.filter(tweet => {
        const metrics = tweet.public_metrics
        const likes = metrics.like_count || 0
        const retweets = metrics.retweet_count || 0 
        const replies = metrics.reply_count || 0
        const views = metrics.impression_count || 0
        
        // Even more lenient for inspiration accounts since these are their TOP tweets
        const passesFilter = likes >= 2 || retweets >= 1 || replies >= 1 || views >= 20
        
        if (!passesFilter) {
          console.log(`⚪ Filtered out @${cleanUsername} tweet: ${likes}L, ${retweets}R, ${replies}C, ${views}V`)
        } else {
          console.log(`✅ Including @${cleanUsername} tweet: ${likes}L, ${retweets}R, ${replies}C, ${views}V`)
        }
        
        return passesFilter
      })

      console.log(`🎯 @${cleanUsername}: ${tweetsData.length} raw → ${tweets.length} transformed → ${highPerformingTweets.length} high-performing`)

      // Add source tracking for inspiration accounts
      const tweetsWithSource = highPerformingTweets.map(tweet => ({
        ...tweet,
        source: 'inspiration_account' as const,
        source_account: cleanUsername
      }))

      console.log(`✅ FINAL: Returning ${tweetsWithSource.length} tweets from @${cleanUsername}`)

      return {
        status: 'success',
        data: tweetsWithSource,
        msg: `Found ${tweetsWithSource.length} high-performing tweets from @${cleanUsername}`
      } as TwitterApiResponse<Tweet[]>

    } catch (error) {
      console.error(`💥 Advanced search error for @${username}:`, error)
      
      // Return empty result instead of error to prevent breaking the entire flow
      return {
        status: 'success',
        data: [],
        msg: `Advanced search failed for @${username}: ${error}`
      } as TwitterApiResponse<Tweet[]>
    }
  }

  // Search for users by keyword (for similar account discovery)
  async searchUsers(query: string, maxResults: number = 20): Promise<TwitterApiResponse<any[]>> {
    try {
      console.log(`🔍 Searching users with query: ${query}`)
      
      const searchParams = new URLSearchParams({
        query: query,
        maxResults: maxResults.toString(),
      })

      const endpoint = `/twitter/user/search?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<any[]>
      }

      const users = response.data?.users || []
      console.log(`✅ Found ${users.length} users for query: ${query}`)

      return {
        status: 'success',
        msg: `Found ${users.length} users`,
        data: users,
      }
    } catch (error) {
      console.error(`Failed to search users for query ${query}:`, error)
      return {
        status: 'error',
        msg: `Failed to search users: ${query}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Get user followers for network analysis (for similar account discovery)
  async getUserFollowings(username: string, maxResults: number = 100): Promise<TwitterApiResponse<any[]>> {
    try {
      const cleanUsername = username.replace('@', '').trim()
      console.log(`👥 Fetching followings for: ${cleanUsername}`)
      
      const searchParams = new URLSearchParams({
        userName: cleanUsername,
        pageSize: Math.min(maxResults, 200).toString(), // API limit is 200
      })

      const endpoint = `/twitter/user/followings?${searchParams}`
      const response = await this.makeRequest<any>(endpoint)

      if (response.status === 'error') {
        return response as TwitterApiResponse<any[]>
      }

      const followings = response.data?.followings || []
      console.log(`✅ Found ${followings.length} followings for @${cleanUsername}`)

      return {
        status: 'success',
        msg: `Found ${followings.length} followings`,
        data: followings,
      }
    } catch (error) {
      console.error(`Failed to fetch followings for ${username}:`, error)
      return {
        status: 'error',
        msg: `Failed to fetch followings: ${username}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  // Search for high-performing tweets from inspiration accounts about specific topics
  async searchInspirationAccountsForTopics(
    topics: string[], 
    inspirationAccounts: string[] = [],
    maxResults: number = 30
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      console.log(`🎯 ADVANCED TOPIC SEARCH from inspiration accounts: ${inspirationAccounts.join(', ')}`)
      console.log(`🎯 About topics: ${topics.join(', ')}`)
      
      const allTweets: Tweet[] = []

      // Search each inspiration account for topic-related content
      for (const account of inspirationAccounts.slice(0, 5)) { // Limit to 5 accounts to avoid rate limits
        try {
          const cleanUsername = account.replace('@', '').trim()
          
          // Create advanced search query: topics + from:username
          const topicQuery = topics.map(topic => `"${topic}"`).join(' OR ')
          const combinedQuery = `(${topicQuery}) from:${cleanUsername}`
          
          console.log(`🔍 Searching: ${combinedQuery}`)
          
          const searchParams = new URLSearchParams({
            query: combinedQuery,
            queryType: 'Top', // Get high-engagement content
            cursor: ''
          })

          const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
          const response = await this.makeRequest<any>(endpoint)
          
          if (response.status === 'success' && response.data?.tweets) {
            const tweets = response.data.tweets.map((tweet: any) => 
              this.transformTweetFromTwitterApiIo(tweet)
            )
            
            // Add source tracking
            const tweetsWithSource = tweets.map((tweet: Tweet) => ({
              ...tweet,
              source: 'inspiration_account' as const,
              source_account: cleanUsername
            }))
            
            allTweets.push(...tweetsWithSource)
            console.log(`✅ Found ${tweets.length} topic tweets from @${cleanUsername}`)
          } else {
            console.log(`⚠️ No topic tweets from @${cleanUsername}`)
          }
          
        } catch (accountError) {
          console.log(`❌ Error searching @${account}:`, accountError)
          continue
        }
      }
      
      // Remove duplicates and limit results
      const uniqueTweets = allTweets.filter((tweet, index, arr) => 
        arr.findIndex(t => t.id === tweet.id) === index
      ).slice(0, maxResults)
      
      console.log(`🎯 TOPIC SEARCH: Found ${uniqueTweets.length} total topic tweets from inspiration accounts`)
      
      return {
        status: 'success',
        data: uniqueTweets,
        msg: `Found ${uniqueTweets.length} topic tweets from inspiration accounts`
      } as TwitterApiResponse<Tweet[]>
      
    } catch (error) {
      console.error(`💥 Topic search error:`, error)
      return {
        status: 'error',
        msg: `Topic search failed: ${error}`,
        error: String(error)
      } as TwitterApiResponse<Tweet[]>
    }
  }

  // Enhanced search method that includes inspiration accounts content
  async searchTweetsWithInspirationAccounts(
    topics: string[], 
    inspirationAccounts: string[] = [],
    maxResults: number = 50
  ): Promise<TwitterApiResponse<Tweet[]>> {
    try {
      console.log(`🎯 UNIFIED ADVANCED SEARCH`)
      console.log(`📚 Topics: ${topics.join(', ')}`)
      console.log(`👑 Inspiration accounts: ${inspirationAccounts.join(', ')}`)
      console.log(`🎯 Target: ${maxResults} total tweets`)
      
      const allTweets: Tweet[] = []

      // If no inspiration accounts, fall back to regular search
      if (inspirationAccounts.length === 0) {
        console.log('📝 No inspiration accounts - using regular topic search only')
        return await this.searchTweets(topics, maxResults)
      }

      // STEP 1: Get high-performing tweets directly from inspiration accounts (30% of results)
      const directAccountTweets = Math.floor(maxResults * 0.3)
      console.log(`📊 STEP 1: Getting ${directAccountTweets} direct tweets from inspiration accounts`)
      
      for (const account of inspirationAccounts.slice(0, 3)) { // Limit to 3 accounts
        const tweetsPerAccount = Math.floor(directAccountTweets / inspirationAccounts.length)
        const accountResult = await this.getUserLastTweets(account, tweetsPerAccount)
        
        if (accountResult.status === 'success' && accountResult.data) {
          allTweets.push(...accountResult.data)
          console.log(`✅ Added ${accountResult.data.length} direct tweets from @${account}`)
        }
      }

      // STEP 2: Get topic-related tweets from inspiration accounts (40% of results)
      const topicAccountTweets = Math.floor(maxResults * 0.4)
      console.log(`📊 STEP 2: Getting ${topicAccountTweets} topic-related tweets from inspiration accounts`)
      
      const topicResult = await this.searchInspirationAccountsForTopics(topics, inspirationAccounts, topicAccountTweets)
      if (topicResult.status === 'success' && topicResult.data) {
        allTweets.push(...topicResult.data)
        console.log(`✅ Added ${topicResult.data.length} topic tweets from inspiration accounts`)
      }

      // STEP 3: Get regular trending topic tweets (30% of results)
      const trendingTweets = Math.floor(maxResults * 0.3)
      console.log(`📊 STEP 3: Getting ${trendingTweets} trending topic tweets`)
      
      const trendingResult = await this.searchTweets(topics, trendingTweets)
      if (trendingResult.status === 'success' && trendingResult.data) {
        // Mark as trending content
        const trendingWithSource = trendingResult.data.map(tweet => ({
          ...tweet,
          source: 'trending' as const,
          source_account: undefined
        }))
        allTweets.push(...trendingWithSource)
        console.log(`✅ Added ${trendingWithSource.length} trending tweets`)
      }

      // Remove duplicates based on tweet ID
      const uniqueTweets = allTweets.filter((tweet, index, arr) => 
        arr.findIndex(t => t.id === tweet.id) === index
      )

      // Shuffle for variety and limit results
      const shuffledTweets = uniqueTweets.sort(() => Math.random() - 0.5).slice(0, maxResults)

      // Calculate breakdown for logging
      const inspirationCount = shuffledTweets.filter(t => t.source === 'inspiration_account').length
      const trendingCount = shuffledTweets.filter(t => t.source === 'trending').length

      console.log(`📊 FINAL BREAKDOWN: ${inspirationCount} inspiration + ${trendingCount} trending = ${shuffledTweets.length} total`)
      console.log(`🎯 Inspiration accounts delivered: ${inspirationCount > 0 ? '✅ SUCCESS' : '❌ FAILED'}`)

      return {
        status: 'success',
        data: shuffledTweets,
        msg: `Unified search: ${inspirationCount} inspiration + ${trendingCount} trending tweets`
      } as TwitterApiResponse<Tweet[]>

    } catch (error) {
      console.error(`💥 Unified search error:`, error)
      
      // Fallback to regular search if everything fails
      console.log('⚠️ Falling back to regular topic search only')
      return await this.searchTweets(topics, maxResults)
    }
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