import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledTweets } from '@/db/schema';
import { eq, and, asc } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Get actual user ID from authentication
    const userId = body.userId || "user-placeholder";
    
    // Validate required fields
    if (!body.content || !body.scheduledAt) {
      return NextResponse.json(
        { status: 'error', error: 'Missing required fields: content, scheduledAt' },
        { status: 400 }
      );
    }

    // Insert the scheduled tweet
    const [scheduledTweet] = await db
      .insert(scheduledTweets)
      .values({
        userId,
        content: body.content,
        originalContent: body.originalContent,
        toolUsed: body.toolUsed,
        scheduledAt: new Date(body.scheduledAt),
        timezone: body.timezone || 'UTC',
        isThread: body.isThread || false,
        threadParts: body.threadParts,
        metadata: body.metadata || {},
      })
      .returning();

    return NextResponse.json({
      status: 'success',
      scheduledTweet,
    });
  } catch (error) {
    console.error('Failed to create scheduled tweet:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to schedule tweet' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // TODO: Get actual user ID from authentication
    const userId = "user-placeholder";
    
    // Build where clause
    const whereClause = status
      ? and(eq(scheduledTweets.userId, userId), eq(scheduledTweets.status, status as any))
      : eq(scheduledTweets.userId, userId);

    // Fetch scheduled tweets
    const tweets = await db
      .select()
      .from(scheduledTweets)
      .where(whereClause)
      .orderBy(asc(scheduledTweets.scheduledAt))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      status: 'success',
      tweets,
    });
  } catch (error) {
    console.error('Failed to fetch scheduled tweets:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to fetch scheduled tweets' },
      { status: 500 }
    );
  }
} 