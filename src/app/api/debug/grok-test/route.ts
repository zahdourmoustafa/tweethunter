import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { grokClient, GROK_MODEL } from '@/lib/grok';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('🔍 Testing Grok API connection...');
    console.log('API Key exists:', !!process.env.GROK_API_KEY);
    console.log('API Key length:', process.env.GROK_API_KEY?.length || 0);
    console.log('NODE_ENV:', process.env.NODE_ENV);

    // Test Grok API connection
    let testResult: { status: string, [key: string]: any } = { status: 'Not tested' };
    
    try {
      if (!process.env.GROK_API_KEY) {
        testResult = { 
          status: '❌ Failed',
          error: 'GROK_API_KEY is not configured',
          details: {
            keyExists: false,
            keyLength: 0,
            nodeEnv: process.env.NODE_ENV
          }
        };
      } else {
        console.log('✅ API key found, testing connection...');
        
        const response = await grokClient.chat.completions.create({
          model: GROK_MODEL,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10,
        });
        
        testResult = { 
          status: '✅ Working',
          model: response.model,
          usage: response.usage,
          responseLength: response.choices[0]?.message?.content?.length || 0,
          details: {
            keyExists: true,
            keyLength: process.env.GROK_API_KEY?.length || 0,
            nodeEnv: process.env.NODE_ENV
          }
        };
        
        console.log('✅ Grok API test successful');
      }
    } catch (error) {
      console.error('❌ Grok API test failed:', error);
      
      testResult = { 
        status: '❌ Failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        details: {
          keyExists: !!process.env.GROK_API_KEY,
          keyLength: process.env.GROK_API_KEY?.length || 0,
          nodeEnv: process.env.NODE_ENV,
          errorType: error instanceof Error ? error.constructor.name : 'Unknown'
        }
      };
    }

    return NextResponse.json({
      testResult,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to test Grok API' },
      { status: 500 }
    );
  }
} 