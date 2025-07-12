import { NextRequest, NextResponse } from 'next/server';
import { storytellerAgent } from '@/lib/ai/storyteller-agent';
import { AITool } from '@/lib/types/aiTools';

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

    // Generate content using our storyteller agent
    const result = await storytellerAgent.generateContent(
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
