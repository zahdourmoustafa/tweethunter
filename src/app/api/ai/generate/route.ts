import { NextRequest, NextResponse } from 'next/server';
import { aiContentGenerator } from '@/lib/services/ai-content-generator';
import { AITool, ContentType, VoiceGeneratorOptions } from '@/lib/types/aiTools';import { db } from '@/lib/db';
import { voiceModels } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      tool, 
      content, 
      options = {} 
    } = body;

    // Validate required fields
    if (!tool || !content) {
      return NextResponse.json(
        { error: 'Tool and content are required' },
        { status: 400 }
      );
    }

    // Validate tool type
    if (!Object.values(AITool).includes(tool)) {
      return NextResponse.json(
        { error: 'Invalid tool specified' },
        { status: 400 }
      );
    }

    // Handle VoiceGenerator tool specifically
    if (tool === AITool.VoiceGenerator) {
      // Check authentication for voice generation with timeout handling
      let session;
      try {
        session = await auth.api.getSession({ headers: request.headers });
      } catch (error) {
        console.error('Database connection error:', error);
        // Allow fallback for development/testing when DB is unavailable
        if (process.env.NODE_ENV === 'development') {
          session = { user: { id: 'dev-user-id' } };
        } else {
          return NextResponse.json(
            { error: 'Database connection failed. Please try again later.' },
            { status: 503 }
          );
        }
      }
      
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required for voice generation' },
          { status: 401 }
        );
      }
      const voiceOptions = options as VoiceGeneratorOptions;
      
      if (!voiceOptions.voiceModelId || !voiceOptions.contentType) {
        return NextResponse.json(
          { error: 'Voice model ID and content type are required for voice generation' },
          { status: 400 }
        );
      }

      // Fetch voice model data with user ownership check
      const voiceModel = await db
        .select()
        .from(voiceModels)
        .where(and(
          eq(voiceModels.id, voiceOptions.voiceModelId),
          eq(voiceModels.userId, session.user.id)
        ))
        .limit(1);

      if (voiceModel.length === 0) {
        return NextResponse.json(
          { error: 'Voice model not found or access denied' },
          { status: 404 }
        );
      }

      // Prepare voice generation options
      const enhancedOptions = {
        voiceGeneratorOptions: {
          contentType: voiceOptions.contentType,
          voiceModelData: {
            twitterUsername: voiceModel[0].twitterUsername,
            analysisData: voiceModel[0].analysisData || {}
          }
        }
      };

      // Generate content using voice model
      const result = await aiContentGenerator.generateContent(
        tool as AITool,
        content,
        enhancedOptions
      );
      return NextResponse.json({
        success: true,
        data: result
      });
    }

    // Generate content using our AI content generator for other tools
    const result = await aiContentGenerator.generateContent(
      tool as AITool,
      content,
      options
    );
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('AI Generation API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
