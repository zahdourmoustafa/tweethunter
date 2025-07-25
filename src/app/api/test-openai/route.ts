import { NextRequest, NextResponse } from 'next/server';
import { aiContentGenerator } from '@/lib/services/ai-content-generator';
import { AITool } from '@/lib/types/aiTools';
export async function GET() {
  try {
    // Test with a simple content generation
    const result = await aiContentGenerator.generateContent(
      AITool.ImproveTweet,
      "This is a test tweet to verify OpenAI is working correctly."
    );
    return NextResponse.json({
      status: 'success',
      message: 'OpenAI is configured correctly',
      result: result.content
    });

  } catch (error) {
    console.error('OpenAI test failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'OpenAI configuration failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
