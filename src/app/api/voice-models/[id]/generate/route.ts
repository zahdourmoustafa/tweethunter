import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { grokTweetGenerationService } from '@/lib/services/grok-tweet-generation';
import { z } from 'zod';

// Schema for tweet generation request
const GenerateTweetSchema = z.object({
  idea: z.string().min(1).max(500, 'Idea must be between 1 and 500 characters'),
  regenerateType: z.enum(['short-punchy', 'medium-story', 'long-detailed', 'thread-style', 'casual-personal', 'professional-insight']).optional(),
});

/**
 * POST /api/voice-models/[id]/generate
 * Generate tweet variations using a voice model
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = GenerateTweetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { idea, regenerateType } = validation.data;

    // If regenerateType is specified, generate only that variation
    if (regenerateType) {
      const result = await grokTweetGenerationService.regenerateVariation(
        session.user.id,
        params.id,
        idea,
        regenerateType
      );

      if (!result.success) {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          variation: result.variation,
        },
      });
    }

    // Generate all 6 variations
    const result = await grokTweetGenerationService.generateVariations(
      session.user.id,
      params.id,
      idea
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        variations: result.variations,
        originalIdea: idea,
        voiceModelId: params.id,
      },
    });
  } catch (error) {
    console.error('Error generating tweets:', error);
    return NextResponse.json(
      { error: 'Failed to generate tweets' },
      { status: 500 }
    );
  }
}
