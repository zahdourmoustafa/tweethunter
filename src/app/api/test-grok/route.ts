/**
 * Test Grok API Connection
 * Simple endpoint to verify Grok API is working
 */

import { NextRequest, NextResponse } from 'next/server';
import { grokClient, GROK_MODEL } from '@/lib/grok';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Testing Grok API connection...');
    console.log('Model:', GROK_MODEL);
    console.log('Base URL:', 'https://api.x.ai/v1');

    const completion = await grokClient.chat.completions.create({
      model: GROK_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are Grok, a chatbot inspired by the Hitchhiker\'s Guide to the Galaxy.'
        },
        {
          role: 'user',
          content: 'Say hello and confirm you are working. Keep it brief.'
        }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    console.log('✅ Grok API response received');
    console.log('Response:', completion);

    const content = completion.choices[0]?.message?.content;

    return NextResponse.json({
      success: true,
      message: 'Grok API is working!',
      response: content,
      model: completion.model,
      usage: completion.usage,
    });

  } catch (error) {
    console.error('❌ Grok API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: {
        name: error instanceof Error ? error.name : undefined,
        stack: error instanceof Error ? error.stack : undefined,
      }
    }, { status: 500 });
  }
}
