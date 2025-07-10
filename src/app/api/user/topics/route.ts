import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse the request body
    const body = await request.json();
    const { topics } = body;

    // Validate topics
    if (!Array.isArray(topics)) {
      return NextResponse.json(
        { error: "Topics must be an array" },
        { status: 400 }
      );
    }

    if (topics.length === 0) {
      return NextResponse.json(
        { error: "At least one topic is required" },
        { status: 400 }
      );
    }

    if (topics.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 topics allowed" },
        { status: 400 }
      );
    }

    // Validate each topic
    const validTopics = topics.filter(topic => 
      typeof topic === "string" && 
      topic.trim().length > 0 && 
      topic.trim().length <= 50
    );

    if (validTopics.length !== topics.length) {
      return NextResponse.json(
        { error: "Invalid topic format" },
        { status: 400 }
      );
    }

    // Find the user in our custom users table by email
    // (Better-auth user table has email, our users table has Twitter data)
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    if (existingUser.length > 0) {
      // Update existing user's topics
      await db
        .update(users)
        .set({ 
          topics: validTopics,
          updatedAt: new Date()
        })
        .where(eq(users.id, existingUser[0].id));
    } else {
      // Create new user record with topics
      // This handles the case where user signed in but doesn't have app-specific data yet
      await db.insert(users).values({
        email: session.user.email,
        username: session.user.name || "user",
        displayName: session.user.name || "User",
        avatarUrl: session.user.image,
        twitterId: session.user.id, // Use Better-auth user ID as fallback
        topics: validTopics,
        verified: false,
      });
    }

    return NextResponse.json(
      { 
        success: true, 
        topics: validTopics,
        message: "Topics saved successfully" 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error saving topics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the user's topics
    const user = await db
      .select({ topics: users.topics })
      .from(users)
      .where(eq(users.email, session.user.email))
      .limit(1);

    const topics = user.length > 0 ? user[0].topics || [] : [];

    return NextResponse.json(
      { topics },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
