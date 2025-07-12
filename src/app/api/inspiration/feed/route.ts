import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inspirationAccounts, users, userSeenTweets, tweetCache } from '@/db/schema'
import { eq, and, notInArray, gte } from 'drizzle-orm'
import { twitterApiService } from '@/lib/services/twitterapi'

// GET - Get enhanced inspiration feed with variety tracking
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userRecord[0].id
    const userTopics = userRecord[0].topics || ['startup', 'business', 'tech']

    // Get user's inspiration accounts (OPTIONAL - graceful if none)
    const inspirationAccountsList = await db
      .select()
      .from(inspirationAccounts)
      .where(and(
        eq(inspirationAccounts.userId, userId),
        eq(inspirationAccounts.isActive, true)
      ))

    console.log(`🎯 User has ${inspirationAccountsList.length} inspiration accounts`)

    let allTweets: any[] = []

    // OPTIONAL FEATURE: If user has inspiration accounts, use enhanced search
    if (inspirationAccountsList.length > 0) {
      const accountUsernames = inspirationAccountsList.map(acc => acc.twitterUsername)
      
      console.log(`✨ Using UNIFIED search with accounts: ${accountUsernames.join(', ')}`)
      
      const enhancedResult = await twitterApiService.searchTweetsWithInspirationAccounts(
        userTopics,
        accountUsernames,
        limit * 2 // Get 2x more initially for bigger pool after filtering
      )

      if (enhancedResult.status === 'success' && enhancedResult.data) {
        allTweets = enhancedResult.data
        console.log(`✅ UNIFIED search returned ${allTweets.length} tweets`)
      } else {
        console.log(`❌ UNIFIED search failed: ${enhancedResult.msg}`)
      }
    }

    // FALLBACK: If no inspiration accounts OR enhanced search failed, use regular search
    if (allTweets.length === 0) {
      console.log(`📰 Using regular trending search (no inspiration accounts or fallback)`)
      
      const regularResult = await twitterApiService.searchTweets(userTopics, limit * 3) // Get 3x more
      
      if (regularResult.status === 'success' && regularResult.data) {
        allTweets = regularResult.data.map(tweet => ({
          ...tweet,
          source: 'trending'
        }))
      }
    }

    // Filter for high-quality content (1k+ impressions)
    const highQualityTweets = allTweets.filter(tweet => {
      const impressions = tweet.public_metrics?.impression_count || 0
      return impressions >= 1000 // Only tweets with 1k+ impressions
    })

    console.log(`🔥 High quality tweets (1k+ impressions): ${highQualityTweets.length}/${allTweets.length}`)

    // Use high quality tweets if we have enough, otherwise fall back to all tweets
    const tweetsToUse = highQualityTweets.length >= limit * 0.7 ? highQualityTweets : allTweets

    // Filter out previously seen tweets (only from recent days to allow eventual recycling)
    const recentSeenTweets = await db
      .select({ tweetId: userSeenTweets.tweetId })
      .from(userSeenTweets)
      .where(and(
        eq(userSeenTweets.userId, userId),
        gte(userSeenTweets.seenAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Only last 7 days
      ))

    const recentSeenIds = recentSeenTweets.map(t => t.tweetId)
    console.log(`👀 User has seen ${recentSeenIds.length} tweets in the last 7 days`)

    const unseenTweets = tweetsToUse.filter(tweet => !recentSeenIds.includes(tweet.id))
    console.log(`🆕 ${unseenTweets.length} unseen tweets after filtering`)

    // Prioritize unseen tweets, only add seen ones if absolutely necessary
    let finalTweets = unseenTweets.slice(0, limit)
    
    if (finalTweets.length < limit * 0.8) { // Only if we have less than 80% of target
      const supplementCount = Math.min(limit - finalTweets.length, Math.floor(limit * 0.2)) // Max 20% can be seen tweets
      const supplementTweets = tweetsToUse
        .filter(tweet => recentSeenIds.includes(tweet.id))
        .slice(0, supplementCount)
      
      finalTweets = [...finalTweets, ...supplementTweets]
      console.log(`🔄 Added ${supplementTweets.length} previously seen tweets (limited to ${Math.floor(limit * 0.2)} max)`)
    }

    // Mark these tweets as seen for future requests
    if (finalTweets.length > 0) {
      const seenRecords = finalTweets.map(tweet => ({
        userId,
        tweetId: tweet.id,
        source: tweet.source || 'trending',
        seenAt: new Date()
      }))

      // Insert seen records (ignore duplicates)
      try {
        await db.insert(userSeenTweets).values(seenRecords).onConflictDoNothing()
        console.log(`✅ Marked ${seenRecords.length} tweets as seen`)
      } catch (error) {
        console.log(`⚠️ Failed to mark some tweets as seen (likely duplicates)`)
      }
    }

    // Add source labels for frontend display
    const tweetsWithLabels = finalTweets.map(tweet => ({
      ...tweet,
      sourceLabel: tweet.source === 'inspiration_account' 
        ? `From @${tweet.source_account} (inspiration account)` 
        : tweet.source === 'trending' 
        ? 'Trending content'
        : 'Recommended content'
    }))

    // Calculate source breakdown
    const inspirationTweets = finalTweets.filter(t => t.source === 'inspiration_account').length
    const topicTweets = finalTweets.filter(t => t.source === 'trending').length

    return NextResponse.json({
      status: 'success',
      data: {
        tweets: tweetsWithLabels,
        stats: {
          total: finalTweets.length,
          inspirationAccounts: inspirationAccountsList.length,
          unseenCount: unseenTweets.length,
          hasInspirationAccounts: inspirationAccountsList.length > 0,
          sourceBreakdown: {
            fromInspirationAccounts: inspirationTweets,
            fromTopics: topicTweets
          }
        }
      }
    })

  } catch (error) {
    console.error('Error fetching inspiration feed:', error)
    
    // Ultimate fallback - return empty array but don't crash
    return NextResponse.json({
      status: 'error',
      error: 'Failed to fetch inspiration feed',
      data: {
        tweets: [],
        stats: {
          total: 0,
          inspirationAccounts: 0,
          unseenCount: 0,
          hasInspirationAccounts: false
        }
      }
    }, { status: 200 }) // Return 200 with empty data instead of 500
  }
}

// POST - Reset seen tweets (allow user to see all content again)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user record
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userRecord[0].id

    // Delete all seen tweets for this user
    await db
      .delete(userSeenTweets)
      .where(eq(userSeenTweets.userId, userId))

    return NextResponse.json({
      status: 'success',
      message: 'Seen tweets history cleared. You will now see fresh content!'
    })

  } catch (error) {
    console.error('Error resetting seen tweets:', error)
    return NextResponse.json(
      { error: 'Failed to reset seen tweets' },
      { status: 500 }
    )
  }
} 