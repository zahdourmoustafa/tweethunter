import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inspirationAccounts, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

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

    // Get all inspiration accounts for this user
    const accounts = await db
      .select()
      .from(inspirationAccounts)
      .where(eq(inspirationAccounts.userId, userId))

    console.log(`📊 Found ${accounts.length} inspiration accounts for user ${userId}`)
    
    return NextResponse.json({
      status: 'success',
      userId,
      userEmail: session.user.email,
      accounts: accounts.map(acc => ({
        id: acc.id,
        twitterUsername: acc.twitterUsername,
        displayName: acc.displayName,
        isActive: acc.isActive,
        addedAt: acc.createdAt
      })),
      total: accounts.length
    })

  } catch (error) {
    console.error('❌ Failed to fetch inspiration accounts:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 