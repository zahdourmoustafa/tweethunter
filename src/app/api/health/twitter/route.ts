import { NextResponse } from 'next/server'
import { twitterApiService } from '@/lib/services/twitterapi'
import { serverEnv } from '@/config/env.server'

export async function GET() {
  try {
    console.log('🏥 Running Twitter API health check...')
    
    // Check if API key is configured
    if (!serverEnv.TWITTERAPI_IO_API_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'TWITTERAPI_IO_API_KEY not configured',
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }

    // Test API connectivity
    const isHealthy = await twitterApiService.healthCheck()
    
    if (isHealthy) {
      return NextResponse.json({
        status: 'success',
        message: 'TwitterAPI.io service is healthy and connected',
        service: 'twitterapi.io',
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        status: 'error',
        message: 'TwitterAPI.io service is not responding correctly',
        service: 'twitterapi.io',
        timestamp: new Date().toISOString(),
      }, { status: 503 })
    }
    
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Health check failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
} 