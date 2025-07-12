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
    const forceRefresh = searchParams.get('refresh') === 'true' // Allow bypassing seen filter

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

    console.log(`🎯 User's selected topics: ${userTopics.join(', ')}`)

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
        limit * 4 // Get 4x more initially for bigger pool after filtering
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
      console.log(`📰 Using regular trending search with user topics: ${userTopics.join(', ')}`)
      
      const regularResult = await twitterApiService.searchTweets(userTopics, limit * 5) // Get 5x more for better variety
      
      if (regularResult.status === 'success' && regularResult.data) {
        allTweets = regularResult.data.map(tweet => ({
          ...tweet,
          source: 'trending'
        }))
        console.log(`✅ Added ${allTweets.length} tweets from user topics: ${userTopics.join(', ')}`)
      }
    }

    // SECONDARY FALLBACK: Only if we have very few tweets, try related topics to user's interests
    if (allTweets.length < limit * 0.5) { // Much more conservative - only if we have less than 50% of what we need
      console.log(`🌐 Very few tweets found (${allTweets.length}), trying related topics to user's interests`)
      
      // Create related topics based on user's actual interests
      const getRelatedTopics = (topics: string[]) => {
        const relatedMap: Record<string, string[]> = {
          'Programming': ['coding', 'software development', 'developers', 'coding tips'],
          'AI & Machine Learning': ['artificial intelligence', 'machine learning', 'AI tools', 'ChatGPT'],
          'Web Development': ['web dev', 'frontend', 'backend', 'JavaScript', 'React'],
          'Entrepreneurship': ['entrepreneur', 'startup founder', 'business owner', 'startup life'],
          'Digital Marketing': ['marketing', 'growth hacking', 'content marketing', 'social media marketing'],
          'Content Marketing': ['content creator', 'content strategy', 'copywriting', 'content tips'],
          'Leadership': ['leadership', 'management', 'team building', 'leadership tips'],
          'Product Management': ['product manager', 'product development', 'user experience', 'product strategy'],
          'SaaS': ['software as a service', 'B2B', 'SaaS metrics', 'recurring revenue'],
          'Investing': ['investment', 'stocks', 'financial markets', 'portfolio'],
          'Personal Finance': ['money management', 'budgeting', 'financial planning', 'wealth building'],
          'Time Management': ['productivity', 'time management', 'efficiency', 'work-life balance'],
          'Remote Work': ['remote work', 'work from home', 'distributed teams', 'remote productivity'],
          'Startups': ['startup', 'founder', 'venture capital', 'startup advice'],
          'Business Growth': ['business growth', 'scaling', 'revenue growth', 'business strategy'],
          'Strategy': ['business strategy', 'strategic planning', 'competitive advantage', 'market analysis'],
          'Management': ['management', 'team management', 'organizational behavior', 'business operations'],
          'SEO': ['search engine optimization', 'SEO tips', 'Google ranking', 'organic traffic'],
          'Social Media': ['social media', 'Twitter', 'LinkedIn', 'social media strategy'],
          'Brand Building': ['branding', 'brand strategy', 'brand awareness', 'brand identity'],
          'Cryptocurrency': ['crypto', 'blockchain', 'Bitcoin', 'cryptocurrency trading'],
          'FinTech': ['financial technology', 'fintech', 'digital banking', 'payment technology'],
          'Productivity Tools': ['productivity apps', 'workflow automation', 'task management', 'productivity hacks'],
          'Goal Setting': ['goal setting', 'personal development', 'achievement', 'success habits'],
          'Workflows': ['workflow', 'process improvement', 'automation', 'efficiency'],
          'B2B Sales': ['B2B sales', 'enterprise sales', 'sales strategy', 'sales funnel'],
          'Customer Success': ['customer success', 'customer retention', 'user onboarding', 'customer experience'],
          'SaaS Marketing': ['SaaS marketing', 'product marketing', 'customer acquisition', 'marketing funnel'],
          'Product-Led Growth': ['product-led growth', 'PLG', 'user activation', 'product adoption'],
          'SaaS Metrics': ['SaaS metrics', 'MRR', 'churn rate', 'customer lifetime value'],
          'Trading': ['trading', 'day trading', 'technical analysis', 'market trends'],
          'Financial Planning': ['financial planning', 'retirement planning', 'wealth management', 'financial advisor'],
          'Life Hacks': ['life hacks', 'productivity tips', 'life improvement', 'efficiency tips'],
          'Cybersecurity': ['cybersecurity', 'information security', 'data protection', 'security threats'],
          'DevOps': ['DevOps', 'continuous integration', 'deployment', 'infrastructure'],
          'Mobile Development': ['mobile development', 'iOS', 'Android', 'app development'],
          'Email Marketing': ['email marketing', 'newsletter', 'email campaigns', 'marketing automation']
        }
        
        const related = new Set<string>()
        topics.forEach(topic => {
          if (relatedMap[topic]) {
            relatedMap[topic].forEach(related_topic => related.add(related_topic))
          }
        })
        
        return Array.from(related).slice(0, 8) // Limit to 8 related topics
      }
      
      const relatedTopics = getRelatedTopics(userTopics)
      console.log(`🔗 Using related topics: ${relatedTopics.join(', ')}`)
      
      if (relatedTopics.length > 0) {
        const broadResult = await twitterApiService.searchTweets(relatedTopics, limit * 2)
        
        if (broadResult.status === 'success' && broadResult.data) {
          const newTweets = broadResult.data
            .filter(tweet => !allTweets.some(existing => existing.id === tweet.id))
            .map(tweet => ({ ...tweet, source: 'trending' }))
          
          allTweets.push(...newTweets)
          console.log(`✅ Added ${newTweets.length} tweets from related topics`)
        }
      }
    }

    // Filter for high-quality content (lower threshold for more variety)
    const highQualityTweets = allTweets.filter(tweet => {
      const impressions = tweet.public_metrics?.impression_count || 0
      return impressions >= 500 // Lowered threshold to 500 impressions for more content
    })

    console.log(`🔥 High quality tweets (500+ impressions): ${highQualityTweets.length}/${allTweets.length}`)

    // Use high quality tweets if we have enough, otherwise fall back to all tweets (more permissive)
    const tweetsToUse = highQualityTweets.length >= limit * 0.5 ? highQualityTweets : allTweets

    // Filter out previously seen tweets (only if not force refreshing)
    let recentSeenIds: string[] = []
    let unseenTweets = tweetsToUse
    
    if (!forceRefresh) {
      const recentSeenTweets = await db
        .select({ tweetId: userSeenTweets.tweetId })
        .from(userSeenTweets)
        .where(and(
          eq(userSeenTweets.userId, userId),
          gte(userSeenTweets.seenAt, new Date(Date.now() - 24 * 60 * 60 * 1000)) // Only last 24 hours (much less restrictive)
        ))

      recentSeenIds = recentSeenTweets.map(t => t.tweetId)
      console.log(`👀 User has seen ${recentSeenIds.length} tweets in the last 24 hours`)

      unseenTweets = tweetsToUse.filter(tweet => !recentSeenIds.includes(tweet.id))
      console.log(`🆕 ${unseenTweets.length} unseen tweets after filtering`)
    } else {
      console.log(`🔄 Force refresh mode - showing all tweets without seen filtering`)
    }

    // Always prioritize fresh content - be much more permissive
    let finalTweets = unseenTweets.slice(0, limit)
    
    // If we don't have enough unseen tweets, fill with previously seen ones (more permissive)
    if (finalTweets.length < limit && !forceRefresh) {
      const supplementCount = Math.min(limit - finalTweets.length, 10) // Actually limit to 10 max
      const supplementTweets = tweetsToUse
        .filter(tweet => recentSeenIds.includes(tweet.id))
        .slice(0, supplementCount)
      
      finalTweets = [...finalTweets, ...supplementTweets]
      console.log(`🔄 Added ${supplementTweets.length} previously seen tweets (limited to 10 max)`)
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