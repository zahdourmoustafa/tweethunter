import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { grokClient, GROK_MODEL } from '@/lib/grok';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check environment variables
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      GROK_API_KEY: process.env.GROK_API_KEY ? '✅ Set' : '❌ Missing',
      GROK_API_KEY_LENGTH: process.env.GROK_API_KEY?.length || 0,
      DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
      TWITTERAPI_IO_API_KEY: process.env.TWITTERAPI_IO_API_KEY ? '✅ Set' : '❌ Missing',
    };

    // Test Grok API connection
    let grokTest: {
      status: string;
      model?: string;
      usage?: any;
      error?: string;
    } = { status: 'Not tested' };
    
    try {
      if (process.env.GROK_API_KEY) {
        const response = await grokClient.chat.completions.create({
          model: GROK_MODEL,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        });
        grokTest = { 
          status: '✅ Working',
          model: response.model,
          usage: response.usage
        };
      } else {
        grokTest = { status: '❌ No API key' };
      }
    } catch (error) {
      grokTest = { 
        status: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      environment: envCheck,
      grokTest,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to get debug info' },
      { status: 500 }
    );
  }
}
