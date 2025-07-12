import { NextResponse } from 'next/server';
import { env } from '@/config/env';

export async function GET() {
  try {
    return NextResponse.json({
      status: 'success',
      environment: {
        NODE_ENV: env.NODE_ENV,
        hasOpenAI: !!env.OPENAI_API_KEY,
        openAIKeyLength: env.OPENAI_API_KEY?.length || 0,
        openAIKeyPrefix: env.OPENAI_API_KEY?.substring(0, 10) + '...',
        hasDatabase: !!env.DATABASE_URL,
        hasTwitter: !!env.TWITTER_CLIENT_SECRET,
        hasAuth: !!env.BETTER_AUTH_SECRET,
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'error', 
        message: 'Environment check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
