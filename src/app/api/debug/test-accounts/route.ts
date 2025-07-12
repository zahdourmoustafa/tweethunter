import { NextRequest, NextResponse } from 'next/server'
import { twitterApiService } from '@/lib/services/twitterapi'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inspirationAccounts, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(request: NextRequest) {
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

    // Get user's actual inspiration accounts from database
    const storedAccounts = await db
      .select()
      .from(inspirationAccounts)
      .where(eq(inspirationAccounts.userId, userId))

    const accountsToTest = storedAccounts.map(acc => acc.twitterUsername)
    
    console.log(`🧪 Testing stored accounts: ${accountsToTest.join(', ')}`)
    
    const results = []
    
    for (const account of accountsToTest) {
      console.log(`🧪 Testing @${account}...`)
      
      // First test if user exists
      const userResult = await twitterApiService.getUserByUsername(account)
      console.log(`👤 User info for @${account}:`, {
        status: userResult.status,
        exists: userResult.status === 'success',
        error: userResult.error
      })
      
      // Then test getting tweets
      const tweetsResult = await twitterApiService.getUserLastTweets(account, 5)
      console.log(`📝 Tweets for @${account}:`, {
        status: tweetsResult.status,
        count: tweetsResult.data?.length || 0,
        error: tweetsResult.error
      })
      
      results.push({
        account: account,
        userExists: userResult.status === 'success',
        userError: userResult.error || userResult.msg,
        tweetsCount: tweetsResult.data?.length || 0,
        tweetsError: tweetsResult.error || tweetsResult.msg,
        sampleTweet: tweetsResult.data?.[0] ? {
          id: tweetsResult.data[0].id,
          text: tweetsResult.data[0].text.substring(0, 100) + '...',
          likes: tweetsResult.data[0].public_metrics.like_count,
          views: tweetsResult.data[0].public_metrics.impression_count
        } : null
      })
    }
    
    // Also test with a known working account
    console.log(`🧪 Testing known working account: elonmusk`)
    const elonTest = await twitterApiService.getUserLastTweets('elonmusk', 3)
    
    return NextResponse.json({
      status: 'success',
      message: 'Account testing complete',
      userAccounts: results,
      knownWorkingTest: {
        account: 'elonmusk',
        works: elonTest.status === 'success',
        count: elonTest.data?.length || 0,
        error: elonTest.error || elonTest.msg
      },
      suggestions: accountsToTest.length === 0 ? 
        ['Try adding accounts like: elonmusk, naval, levelsio, paulg'] :
        results.filter(r => !r.userExists).length > 0 ? 
        ['Some accounts not found. Try: elonmusk, naval, levelsio, paulg'] : 
        null,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Debug test failed:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 