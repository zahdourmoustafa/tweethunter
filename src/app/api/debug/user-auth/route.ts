import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { account, user, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session found'
      })
    }

    console.log('🔍 Debugging user authentication for:', session.user.email)

    // Check Better-auth user table
    const userRecord = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1)

    // Check Better-auth account table for Twitter
    const twitterAccount = await db
      .select()
      .from(account)
      .where(
        and(
          eq(account.userId, session.user.id),
          eq(account.providerId, 'twitter')
        )
      )
      .limit(1)

    // Check app-specific users table
    const appUserRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email || ''))
      .limit(1)

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.user.id,
        email: session.user.email,
        name: session.user.name,
      },
      betterAuthUser: {
        exists: userRecord.length > 0,
        data: userRecord[0] || null
      },
      twitterAccount: {
        exists: twitterAccount.length > 0,
        hasAccessToken: twitterAccount[0]?.accessToken ? 'YES' : 'NO',
        hasRefreshToken: twitterAccount[0]?.refreshToken ? 'YES' : 'NO',
        expiresAt: twitterAccount[0]?.accessTokenExpiresAt?.toISOString() || 'No expiry',
        scope: twitterAccount[0]?.scope || 'No scope',
        providerId: twitterAccount[0]?.providerId || 'No provider',
        accountId: twitterAccount[0]?.accountId || 'No account ID',
        isExpired: twitterAccount[0]?.accessTokenExpiresAt 
          ? new Date() > twitterAccount[0].accessTokenExpiresAt 
          : 'Unknown',
        // Don't log actual tokens for security
        tokenPreview: twitterAccount[0]?.accessToken 
          ? `${twitterAccount[0].accessToken.substring(0, 10)}...` 
          : 'No token'
      },
      appUser: {
        exists: appUserRecord.length > 0,
        data: appUserRecord[0] || null
      }
    })

  } catch (error) {
    console.error('❌ Debug auth error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 