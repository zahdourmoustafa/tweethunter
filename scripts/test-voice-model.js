/**
 * Test script for voice model creation
 * Run with: node scripts/test-voice-model.js
 */

const fetch = require('node-fetch');

async function testVoiceModelCreation() {
  const testUsername = 'elonmusk'; // Use a public account for testing
  
  console.log('🧪 Testing voice model creation...');
  console.log('Target username:', testUsername);
  
  try {
    const response = await fetch('http://localhost:3000/api/voice-models', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth headers if needed
      },
      body: JSON.stringify({
        twitterUsername: testUsername
      })
    });

    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✅ Voice model creation successful!');
      console.log('Model ID:', data.data?.id);
      console.log('Warnings:', data.warnings);
    } else {
      console.log('❌ Voice model creation failed');
      console.log('Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testVoiceModelCreation(); 