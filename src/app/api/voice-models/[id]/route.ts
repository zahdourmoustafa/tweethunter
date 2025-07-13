import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { voiceAnalysisService } from '@/lib/services/voice-analysis';

/**
 * GET /api/voice-models/[id]
 * Get a specific voice model
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const voiceModel = await voiceAnalysisService.getVoiceModel(params.id);

    if (!voiceModel || voiceModel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Voice model not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: voiceModel.id,
        twitterUsername: voiceModel.twitterUsername,
        displayName: voiceModel.displayName,
        analysisData: voiceModel.analysisData,
        confidenceScore: parseInt(voiceModel.confidenceScore || '0'),
        tweetCount: parseInt(voiceModel.tweetCount || '0'),
        lastAnalyzedAt: voiceModel.lastAnalyzedAt,
        createdAt: voiceModel.createdAt,
        updatedAt: voiceModel.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching voice model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice model' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/voice-models/[id]
 * Refresh/update a voice model
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const voiceModel = await voiceAnalysisService.getVoiceModel(params.id);
    if (!voiceModel || voiceModel.userId !== session.user.id) {
      return NextResponse.json({ error: 'Voice model not found' }, { status: 404 });
    }

    // Refresh the voice model
    const result = await voiceAnalysisService.refreshVoiceModel(session.user.id, params.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Get the updated voice model
    const updatedModel = await voiceAnalysisService.getVoiceModel(params.id);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedModel!.id,
        twitterUsername: updatedModel!.twitterUsername,
        displayName: updatedModel!.displayName,
        confidenceScore: parseInt(updatedModel!.confidenceScore || '0'),
        tweetCount: parseInt(updatedModel!.tweetCount || '0'),
        lastAnalyzedAt: updatedModel!.lastAnalyzedAt,
        updatedAt: updatedModel!.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating voice model:', error);
    return NextResponse.json(
      { error: 'Failed to update voice model' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/voice-models/[id]
 * Delete a voice model
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await voiceAnalysisService.deleteVoiceModel(session.user.id, params.id);

    if (!success) {
      return NextResponse.json({ error: 'Voice model not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Voice model deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting voice model:', error);
    return NextResponse.json(
      { error: 'Failed to delete voice model' },
      { status: 500 }
    );
  }
}
