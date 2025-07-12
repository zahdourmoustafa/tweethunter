import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedContent } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// Helper function to generate title from content
function generateTitle(content: string): string {
  const words = content.trim().split(/\s+/);
  const title = words.slice(0, 8).join(' ');
  return title.length > 50 ? title.substring(0, 47) + '...' : title;
}

// GET - Fetch all saved content for user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const content = await db
      .select()
      .from(savedContent)
      .where(eq(savedContent.userId, userId))
      .orderBy(desc(savedContent.updatedAt));

    return NextResponse.json({
      status: 'success',
      data: content
    });

  } catch (error) {
    console.error('Error fetching saved content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved content' },
      { status: 500 }
    );
  }
}

// POST - Save new content
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, 
      content, 
      originalContent, 
      toolUsed, 
      chatHistory,
      tags = [],
      tweetMetadata
    } = body;

    if (!userId || !content || !toolUsed) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, content, toolUsed' },
        { status: 400 }
      );
    }

    // Generate title from content
    const title = generateTitle(content);

    // Convert chat history timestamps to strings for JSON storage
    const serializedChatHistory = chatHistory?.map((msg: any) => ({
      ...msg,
      timestamp: msg.timestamp instanceof Date ? msg.timestamp.toISOString() : msg.timestamp
    })) || [];

    const [newContent] = await db
      .insert(savedContent)
      .values({
        userId,
        title,
        content,
        originalContent,
        toolUsed,
        chatHistory: serializedChatHistory,
        tags,
        tweetMetadata: tweetMetadata || null
      })
      .returning();

    return NextResponse.json({
      status: 'success',
      data: newContent
    });

  } catch (error) {
    console.error('Error saving content:', error);
    return NextResponse.json(
      { error: 'Failed to save content' },
      { status: 500 }
    );
  }
}

// DELETE - Delete saved content
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!id || !userId) {
      return NextResponse.json(
        { error: 'Content ID and User ID are required' },
        { status: 400 }
      );
    }

    // Verify ownership before deletion
    const [deleted] = await db
      .delete(savedContent)
      .where(eq(savedContent.id, id) && eq(savedContent.userId, userId))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { error: 'Content not found or unauthorized' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Content deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting content:', error);
    return NextResponse.json(
      { error: 'Failed to delete content' },
      { status: 500 }
    );
  }
}
