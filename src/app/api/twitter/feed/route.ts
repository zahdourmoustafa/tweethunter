import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { twitterApiService } from '@/lib/services/twitterapi'
import type { Tweet } from '@/lib/types/twitter'

// Cache for reducing API calls
const CACHE_DURATION = 15 * 60 * 1000 // 15 minutes
const cache = new Map<string, { data: Tweet[]; timestamp: number }>()

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📥 Fetching inspirations for user:', session.user.email)

    // Get query parameters
    const url = new URL(request.url)
    const bypassCache = url.searchParams.get('nocache') === 'true'

    console.log('🔍 API CALL DEBUG:')
    console.log('   🚫 Cache bypass:', bypassCache)
    console.log('   🌐 Full URL:', request.url)

    // Get user's interests/topics from database
    const userTopics = await getUserTopics(session.user.email)
    console.log('🎯 User topics:', userTopics)

    // Check cache first
    const cacheKey = `tweets_global_${userTopics.join('_')}`
    const cached = cache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION && !bypassCache) {
      console.log('📦 Returning cached tweets')
      return NextResponse.json({
        tweets: cached.data,
        source: 'global-cached',
        count: cached.data.length,
      })
    }

    let tweets: Tweet[] = []
    let source = ''

    // Fetch global tweets with thread context from twitterapi.io
    console.log('🌐 Fetching global tweets with thread context from twitterapi.io...')
    const response = await twitterApiService.searchTweetsWithThreads(userTopics, 20)

    if (response.status === 'error') {
      console.error('❌ Global TwitterAPI error:', response.msg)
      return NextResponse.json({ 
        tweets: [],
        source: 'error',
        error: response.msg,
        count: 0,
      }, { status: 500 })
    }

    tweets = response.data || []
    source = 'global-fresh'

    // Debug media information
    console.log(`✅ Successfully fetched ${tweets.length} tweets from ${source}`)

    // Update cache
    cache.set(cacheKey, {
      data: tweets,
      timestamp: Date.now(),
    })

    return NextResponse.json({
      tweets,
      source,
      count: tweets.length,
      message: `Found ${tweets.length} high-engagement tweets for your interests`,
    })

  } catch (error) {
    console.error('❌ Failed to fetch tweets:', error)
    return NextResponse.json({
      error: 'Failed to fetch inspirations',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}

// Helper function to get user topics from database
async function getUserTopics(email: string): Promise<string[]> {
  try {
    const user = await db
      .select({ topics: users.topics })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const topics = user[0]?.topics || []
    
    // Return user topics or default ones
    return topics.length > 0 ? topics : ['startup', 'business', 'tech', 'productivity']
  } catch (error) {
    console.error('Failed to get user topics:', error)
    return ['startup', 'business', 'tech', 'productivity']
  }
}
