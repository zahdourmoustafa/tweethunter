import { NextRequest, NextResponse } from 'next/server'
import { twitterApiService } from '@/lib/services/twitterapi'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testQuery = searchParams.get('query') || 'startup'
    const testAccount = searchParams.get('account') || 'elonmusk'
    
    console.log(`🧪 Testing advanced search with query: "${testQuery}"`)
    
    const tests = [
      {
        name: 'Basic Topic Search',
        query: testQuery,
        queryType: 'Top'
      },
      {
        name: 'From User Search',
        query: `from:${testAccount}`,
        queryType: 'Top'
      },
      {
        name: 'Combined Search',
        query: `${testQuery} from:${testAccount}`,
        queryType: 'Top'
      }
    ]
    
    const results = []
    
    for (const test of tests) {
      console.log(`🧪 Testing: ${test.name} - Query: "${test.query}"`)
      
      try {
        const searchParams = new URLSearchParams({
          query: test.query,
          queryType: test.queryType,
          cursor: ''
        })

        const endpoint = `/twitter/tweet/advanced_search?${searchParams}`
        console.log(`🔗 Test endpoint: https://api.twitterapi.io${endpoint}`)
        
        const response = await twitterApiService.makeRequest(endpoint)
        
        results.push({
          test: test.name,
          query: test.query,
          status: response.status,
          tweetsCount: (response.data as any)?.tweets?.length || 0,
          error: response.error,
          msg: response.msg,
          sampleTweet: (response.data as any)?.tweets?.[0] ? {
            id: (response.data as any).tweets[0].id,
            text: (response.data as any).tweets[0].text?.substring(0, 100),
            author: (response.data as any).tweets[0].author?.userName,
            likeCount: (response.data as any).tweets[0].likeCount
          } : null
        })
        
        console.log(`✅ ${test.name}: ${response.status} - ${(response.data as any)?.tweets?.length || 0} tweets`)
        
      } catch (testError) {
        console.error(`❌ ${test.name} failed:`, testError)
        results.push({
          test: test.name,
          query: test.query,
          status: 'error',
          error: String(testError)
        })
      }
    }
    
    return NextResponse.json({
      status: 'success',
      data: {
        testQuery,
        testAccount,
        results
      }
    })
    
  } catch (error) {
    console.error('🧪 Test endpoint error:', error)
    return NextResponse.json({
      status: 'error',
      error: String(error)
    }, { status: 500 })
  }
} 