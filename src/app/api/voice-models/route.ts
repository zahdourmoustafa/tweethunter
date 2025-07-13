import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { grokVoiceAnalysisService } from '@/lib/services/grok-voice-analysis';
import { z } from 'zod';

// Schema for creating voice model
const CreateVoiceModelSchema = z.object({
  twitterUsername: z.string().min(1).max(50).regex(/^@?[a-zA-Z0-9_]+$/, 'Invalid Twitter username format'),
});

/**
 * GET /api/voice-models
 * Get all voice models for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const voiceModels = await grokVoiceAnalysisService.getUserVoiceModels(session.user.id);

    return NextResponse.json({
      success: true,
      data: voiceModels.map(model => ({
        id: model.id,
        twitterUsername: model.twitterUsername,
        displayName: model.displayName,
        confidenceScore: parseInt(model.confidenceScore || '0'),
        tweetCount: parseInt(model.tweetCount || '0'),
        lastAnalyzedAt: model.lastAnalyzedAt,
        createdAt: model.createdAt,
        updatedAt: model.updatedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching voice models:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice models' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/voice-models
 * Create a new voice model by analyzing a Twitter account
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = CreateVoiceModelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { twitterUsername } = validation.data;

    // Check if user already has this voice model
    const existingModels = await grokVoiceAnalysisService.getUserVoiceModels(session.user.id);
    const cleanUsername = twitterUsername.replace('@', '').toLowerCase();
    
    const existingModel = existingModels.find(
      model => model.twitterUsername.toLowerCase() === cleanUsername
    );

    if (existingModel) {
      return NextResponse.json(
        { error: 'Voice model for this Twitter account already exists' },
        { status: 409 }
      );
    }

    // Check if user has reached the limit (10 voice models max)
    if (existingModels.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of voice models reached (10)' },
        { status: 429 }
      );
    }

    // Analyze the account
    const result = await grokVoiceAnalysisService.analyzeAccount(session.user.id, twitterUsername);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get the created voice model
    const voiceModel = await grokVoiceAnalysisService.getVoiceModel(result.voiceModelId!);

    return NextResponse.json({
      success: true,
      data: {
        id: voiceModel!.id,
        twitterUsername: voiceModel!.twitterUsername,
        displayName: voiceModel!.displayName,
        confidenceScore: parseInt(voiceModel!.confidenceScore || '0'),
        tweetCount: parseInt(voiceModel!.tweetCount || '0'),
        lastAnalyzedAt: voiceModel!.lastAnalyzedAt,
        createdAt: voiceModel!.createdAt,
      },
      warnings: result.warnings,
    });
  } catch (error) {
    console.error('Error creating voice model:', error);
    return NextResponse.json(
      { error: 'Failed to create voice model' },
      { status: 500 }
    );
  }
}
