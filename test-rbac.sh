#!/bin/bash

# Test RBAC API Endpoints
#
# Usage:
# 1. Get your token from browser console:
#    JSON.parse(localStorage.getItem('login_data'))?.token
#
# 2. Run this script:
#    TOKEN="your_token_here" ./test-rbac.sh

if [ -z "$TOKEN" ]; then
  echo "❌ ERROR: No token provided"
  echo ""
  echo "Usage:"
  echo "  TOKEN=\"your_token_here\" ./test-rbac.sh"
  echo ""
  echo "Get your token from browser console:"
  echo "  JSON.parse(localStorage.getItem('login_data'))?.token"
  exit 1
fi

echo "🧪 Testing RBAC API Endpoints..."
echo ""
echo "Token: ${TOKEN:0:20}...${TOKEN: -10}"
echo ""

test_endpoint() {
  local name="$1"
  local path="$2"

  echo ""
  echo "================================================================================"
  echo "Testing: $name"
  echo "Path: $path"
  echo "================================================================================"

  response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "http://localhost:8000$path")

  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')

  echo "✅ Status: $http_code"
  echo ""
  echo "📦 Response:"
  echo "$body" | python3 -m json.tool 2>/dev/null || echo "$body"
  echo ""
}

# Test endpoints
test_endpoint "Roles (/rbac/roles)" "/rbac/roles"
test_endpoint "Permissions (/rbac/permissions)" "/rbac/permissions"
test_endpoint "Roles (/v1/rbac/roles)" "/v1/rbac/roles"
test_endpoint "Permissions (/v1/rbac/permissions)" "/v1/rbac/permissions"

echo ""
echo "================================================================================"
echo "🎯 Next Steps"
echo "================================================================================"
echo ""
echo "1. Check which endpoints returned 200 status"
echo "2. Look at the response structure - is it:"
echo "   - Direct array: [...]"
echo "   - Wrapped: {data: [...]}"
echo "   - Standard: {success: true, data: [...]}"
echo "3. Share the output with me so I can update the frontend code"
echo ""
