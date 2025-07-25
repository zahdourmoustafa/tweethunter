import { NextRequest, NextResponse } from 'next/server';
import { aiContentGenerator } from '@/lib/services/ai-content-generator';
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      currentContent, 
      userMessage, 
      conversationHistory = [] 
    } = body;

    // Validate required fields
    if (!currentContent || !userMessage) {
      return NextResponse.json(
        { error: 'Current content and user message are required' },
        { status: 400 }
      );
    }

    // Refine content using conversational AI
    const result = await aiContentGenerator.refineContent(
      currentContent,
      userMessage,
      conversationHistory
    );
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('AI Chat API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
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
