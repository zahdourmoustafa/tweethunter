#!/usr/bin/env node

/**
 * Test script for TwitterAPI.io integration
 * Run with: node scripts/test-twitter-api.js
 */

require('dotenv').config();

const API_KEY = process.env.TWITTERAPI_IO_API_KEY;
const BASE_URL = 'https://api.twitterapi.io';

if (!API_KEY) {
  console.error('❌ TWITTERAPI_IO_API_KEY environment variable is not set');
  process.exit(1);
}

async function testEndpoint(endpoint, description, params = {}) {
  console.log(`\n🧪 Testing: ${description}`);
  console.log(`📍 Endpoint: ${endpoint}`);
  
  const url = new URL(`${BASE_URL}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value.toString());
  });
  
  console.log(`🔗 Full URL: ${url.toString()}`);
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-API-Key': API_KEY, // Correct header format
        'Content-Type': 'application/json',
      },
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success!');
      console.log('📄 Response keys:', Object.keys(data));
      
      if (data.data) {
        console.log('👤 User data keys:', Object.keys(data.data));
        if (data.data.userName) {
          console.log(`👤 Username: ${data.data.userName}`);
          console.log(`👤 Name: ${data.data.name}`);
          console.log(`👤 Followers: ${data.data.followers}`);
        }
      }
      
      if (data.tweets) {
        console.log(`📝 Found ${data.tweets.length} tweets`);
        if (data.tweets.length > 0) {
          console.log('📝 First tweet keys:', Object.keys(data.tweets[0]));
          console.log('📝 First tweet text preview:', data.tweets[0].text?.substring(0, 100) + '...');
        }
      }
      
      if (data.status) {
        console.log(`📊 Status: ${data.status}`);
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed!');
      console.log('🔍 Error:', errorText);
    }
  } catch (error) {
    console.log('💥 Network Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting TwitterAPI.io endpoint tests...');
  console.log(`🔑 Using API key: ${API_KEY.substring(0, 8)}...`);

  // Test user info endpoints
  await testEndpoint('/twitter/user/info', 'Get Elon Musk account info', { userName: 'elonmusk' });
  await testEndpoint('/twitter/user/info', 'Get OpenAI account info', { userName: 'openai' });
  
  // Test tweets endpoints
  await testEndpoint('/twitter/user/last_tweets', 'Get Elon Musk tweets', { userName: 'elonmusk', includeReplies: false });
  await testEndpoint('/twitter/user/last_tweets', 'Get OpenAI tweets', { userName: 'openai', includeReplies: false });
  
  // Test a non-existent user
  await testEndpoint('/twitter/user/info', 'Test non-existent user', { userName: 'thisuserdoesnotexist12345' });
  
  console.log('\n🏁 Tests completed!');
  console.log('\n📝 Notes:');
  console.log('- If you see 404 errors, check your API key validity');
  console.log('- If you see 401/403 errors, check your API key permissions');
  console.log('- If you see rate limit errors, wait a moment and try again');
  console.log('- The tweets endpoint should return a "tweets" array in the response');
}

runTests().catch(console.error);
