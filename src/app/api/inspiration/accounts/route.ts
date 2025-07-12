import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { inspirationAccounts, users } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import { twitterApiService } from '@/lib/services/twitterapi'

// GET - Get user's inspiration accounts
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user record to find user ID
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1)

    if (userRecord.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = userRecord[0].id

    // Get user's inspiration accounts
    const accounts = await db
      .select()
      .from(inspirationAccounts)
      .where(and(
        eq(inspirationAccounts.userId, userId),
        eq(inspirationAccounts.isActive, true)
      ))
      .orderBy(inspirationAccounts.createdAt)

    return NextResponse.json({
      status: 'success',
      data: accounts
    })

  } catch (error) {
    console.error('Error fetching inspiration accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch inspiration accounts' },
      { status: 500 }
    )
  }
}

// POST - Add new inspiration account
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { username } = body

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
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

    // Check if user already has too many inspiration accounts (limit to 10)
    const existingAccounts = await db
      .select()
      .from(inspirationAccounts)
      .where(and(
        eq(inspirationAccounts.userId, userId),
        eq(inspirationAccounts.isActive, true)
      ))

    if (existingAccounts.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum 10 inspiration accounts allowed' },
        { status: 400 }
      )
    }

    // Check if account already exists for this user
    const cleanUsername = username.replace('@', '').trim()
    const existingAccount = await db
      .select()
      .from(inspirationAccounts)
      .where(and(
        eq(inspirationAccounts.userId, userId),
        eq(inspirationAccounts.twitterUsername, cleanUsername),
        eq(inspirationAccounts.isActive, true)
      ))
      .limit(1)

    if (existingAccount.length > 0) {
      return NextResponse.json(
        { error: 'Account already added to your inspiration list' },
        { status: 400 }
      )
    }

    // Validate account exists on Twitter
    const userProfile = await twitterApiService.getUserByUsername(cleanUsername)
    
    if (userProfile.status === 'error') {
      return NextResponse.json(
        { error: `Twitter account @${cleanUsername} not found or inaccessible` },
        { status: 400 }
      )
    }

    const profileData = userProfile.data?.data
    if (!profileData) {
      return NextResponse.json(
        { error: 'Failed to fetch account details' },
        { status: 400 }
      )
    }

    // Add to inspiration accounts
    const newAccount = await db
      .insert(inspirationAccounts)
      .values({
        userId,
        twitterUsername: cleanUsername,
        twitterUserId: profileData.id || profileData.userId || '',
        displayName: profileData.name || profileData.displayName || cleanUsername,
        avatarUrl: profileData.profilePicture || profileData.avatar_url,
        verified: profileData.verified || profileData.isBlueVerified || false,
        followerCount: profileData.followers?.toString() || '0',
        bio: profileData.description || profileData.bio || '',
        isActive: true,
        lastFetchedAt: new Date(),
      })
      .returning()

    return NextResponse.json({
      status: 'success',
      message: `Successfully added @${cleanUsername} to your inspiration accounts`,
      data: newAccount[0]
    })

  } catch (error) {
    console.error('Error adding inspiration account:', error)
    return NextResponse.json(
      { error: 'Failed to add inspiration account' },
      { status: 500 }
    )
  }
}

// DELETE - Remove inspiration account
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    })
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('id')

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
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

    // Soft delete (deactivate) the account
    const deletedAccount = await db
      .update(inspirationAccounts)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(and(
        eq(inspirationAccounts.id, accountId),
        eq(inspirationAccounts.userId, userId)
      ))
      .returning()

    if (deletedAccount.length === 0) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Inspiration account removed successfully'
    })

  } catch (error) {
    console.error('Error removing inspiration account:', error)
    return NextResponse.json(
      { error: 'Failed to remove inspiration account' },
      { status: 500 }
    )
  }
} 