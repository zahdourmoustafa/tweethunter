#!/bin/bash

# Test script for TwitterAPI.io integration using curl
# Run with: bash scripts/test-twitter-api.sh

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

API_KEY="${TWITTERAPI_IO_API_KEY}"
BASE_URL="https://api.twitterapi.io"

if [ -z "$API_KEY" ]; then
    echo "❌ TWITTERAPI_IO_API_KEY environment variable is not set"
    exit 1
fi

echo "🚀 Starting TwitterAPI.io endpoint tests..."
echo "🔑 Using API key: ${API_KEY:0:8}..."

test_endpoint() {
    local endpoint="$1"
    local description="$2"
    local params="$3"
    
    echo ""
    echo "🧪 Testing: $description"
    echo "📍 Endpoint: $endpoint"
    
    local url="${BASE_URL}${endpoint}"
    if [ -n "$params" ]; then
        url="${url}?${params}"
    fi
    
    echo "🔗 Full URL: $url"
    
    echo "📊 Response:"
    curl -s -w "\n📊 HTTP Status: %{http_code}\n" \
         -H "X-API-Key: $API_KEY" \
         -H "Content-Type: application/json" \
         "$url" | head -20
    
    echo "---"
}

# Test the correct endpoint format from documentation
test_endpoint "/twitter/user/info" "Get Twitter official account" "userName=twitter"
test_endpoint "/twitter/user/info" "Get Elon Musk account" "userName=elonmusk"
test_endpoint "/twitter/user/info" "Test non-existent user" "userName=thisuserdoesnotexist12345"

echo ""
echo "🏁 Tests completed!"
echo ""
echo "📝 Notes:"
echo "- If you see 404 errors, check your API key validity"
echo "- If you see 401/403 errors, check your API key permissions"
echo "- If you see rate limit errors, wait a moment and try again"
