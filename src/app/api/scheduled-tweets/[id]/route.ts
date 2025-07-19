import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scheduledTweets } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id: tweetId } = await context.params;
    
    // TODO: Get actual user ID from authentication
    const userId = "user-placeholder";
    
    // Delete the scheduled tweet
    const [deletedTweet] = await db
      .delete(scheduledTweets)
      .where(
        and(
          eq(scheduledTweets.id, tweetId),
          eq(scheduledTweets.userId, userId)
        )
      )
      .returning();

    if (!deletedTweet) {
      return NextResponse.json(
        { status: 'error', error: 'Scheduled tweet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Scheduled tweet deleted successfully',
    });
  } catch (error) {
    console.error('Failed to delete scheduled tweet:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to delete scheduled tweet' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id: tweetId } = await context.params;
    const body = await request.json();
    
    // TODO: Get actual user ID from authentication
    const userId = "user-placeholder";
    
    // Validate required fields
    if (!body.content || !body.scheduledAt) {
      return NextResponse.json(
        { status: 'error', error: 'Missing required fields: content, scheduledAt' },
        { status: 400 }
      );
    }

    // Update the scheduled tweet
    const [updatedTweet] = await db
      .update(scheduledTweets)
      .set({
        content: body.content,
        originalContent: body.originalContent,
        toolUsed: body.toolUsed,
        scheduledAt: new Date(body.scheduledAt),
        timezone: body.timezone || 'UTC',
        isThread: body.isThread || false,
        threadParts: body.threadParts || [],
        status: body.status as any, // TODO: Use proper enum type
        metadata: body.metadata || {},
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(scheduledTweets.id, tweetId),
          eq(scheduledTweets.userId, userId)
        )
      )
      .returning();

    if (!updatedTweet) {
      return NextResponse.json(
        { status: 'error', error: 'Scheduled tweet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      scheduledTweet: updatedTweet,
    });
  } catch (error) {
    console.error('Failed to update scheduled tweet:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to update scheduled tweet' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id: tweetId } = await context.params;
    const body = await request.json();
    
    // TODO: Get actual user ID from authentication
    const userId = "user-placeholder";
    
    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { status: 'error', error: 'Missing required field: status' },
        { status: 400 }
      );
    }

    // Update only the status and related fields
    const updateData: any = {
      status: body.status as any,
      updatedAt: new Date(),
    };

    if (body.status === 'posted' && body.postedAt) {
      updateData.postedAt = new Date(body.postedAt);
    }

    const [updatedTweet] = await db
      .update(scheduledTweets)
      .set(updateData)
      .where(
        and(
          eq(scheduledTweets.id, tweetId),
          eq(scheduledTweets.userId, userId)
        )
      )
      .returning();

    if (!updatedTweet) {
      return NextResponse.json(
        { status: 'error', error: 'Scheduled tweet not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      scheduledTweet: updatedTweet,
    });
  } catch (error) {
    console.error('Failed to update tweet status:', error);
    return NextResponse.json(
      { status: 'error', error: 'Failed to update tweet status' },
      { status: 500 }
    );
  }
}