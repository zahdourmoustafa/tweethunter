import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { twitterApiService } from '@/lib/services/twitterapi'
import type { Tweet } from '@/lib/types/twitter'

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('📥 Fetching fresh inspirations for user:', session.user.email)

    // Get user's interests/topics from database
    const userTopics = await getUserTopics(session.user.email)
    console.log('🎯 User topics:', userTopics)

    // Always fetch fresh tweets - no caching for real-time content discovery
    console.log('🔥 Fetching FRESH tweets with thread context from twitterapi.io...')
    const response = await twitterApiService.searchTweetsWithThreads(userTopics, 50)

    if (response.status === 'error') {
      console.error('❌ TwitterAPI error:', response.msg)
      return NextResponse.json({ 
        tweets: [],
        source: 'error',
        error: response.msg,
        count: 0,
      }, { status: 500 })
    }

    const tweets = response.data || []
    console.log(`✅ Successfully fetched ${tweets.length} FRESH tweets for real-time discovery`)

    return NextResponse.json({
      tweets,
      source: 'fresh',
      count: tweets.length,
      message: `Found ${tweets.length} fresh high-engagement tweets for your interests`,
      timestamp: new Date().toISOString(),
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
