import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Server-side environment check
    const serverConfig = {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_URL: process.env.VERCEL_URL ? 'SET' : 'NOT_SET',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL ? 'SET' : 'NOT_SET',
      NEXT_PUBLIC_BETTER_AUTH_URL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ? 'SET' : 'NOT_SET',
      TWITTER_CLIENT_ID: process.env.TWITTER_CLIENT_ID ? 'SET' : 'NOT_SET',
      NEXT_PUBLIC_TWITTER_CLIENT_ID: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID ? 'SET' : 'NOT_SET',
      TWITTER_CLIENT_SECRET: process.env.TWITTER_CLIENT_SECRET ? 'SET' : 'NOT_SET',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? `SET (${process.env.BETTER_AUTH_SECRET.length} chars)` : 'NOT_SET',
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
    };

    // Base URL calculation
    function getBaseURL() {
      if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) {
        return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
      }
      if (process.env.VERCEL_URL) {
        return `https://${process.env.VERCEL_URL}`;
      }
      if (process.env.BETTER_AUTH_URL) {
        return process.env.BETTER_AUTH_URL;
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error('NEXT_PUBLIC_BETTER_AUTH_URL must be set in production');
      }
      return 'http://localhost:3000';
    }

    const calculatedBaseURL = getBaseURL();

    return NextResponse.json({
      serverConfig,
      calculatedBaseURL,
      requestHeaders: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to get config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 