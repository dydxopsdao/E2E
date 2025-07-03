#!/usr/bin/env bash
#
# Script: checkApplitoolsBatchByPointer.sh
# Usage: ./checkApplitoolsBatchByPointer.sh <applitools_server_url> <api_key> <pointer_id>
#
# 1) Fetches Applitools batches from the last day.
# 2) Filters to find those whose pointerId == <pointer_id>.
# 3) Sorts by .startedAt, takes the last (newest) item.
# 4) Emits foundBatchID and needsReview based on failed/unresolved counts.

set -e

echo "=== Applitools Batch Check Start ==="

APPLITOOLS_SERVER_URL="$1"
APPLITOOLS_API_KEY="$2"
POINTER_ID="$3"

if [ -z "$APPLITOOLS_SERVER_URL" ] || [ -z "$APPLITOOLS_API_KEY" ] || [ -z "$POINTER_ID" ]; then
  echo "Usage: $0 <applitools_server_url> <api_key> <pointer_id>"
  exit 1
fi

START_DATE="$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)"
END_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "Fetching Applitools batches from $START_DATE to $END_DATE..."
echo "Looking for batches with pointerId: $POINTER_ID"

response=$(curl -s -X GET \
  -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
  "${APPLITOOLS_SERVER_URL}/api/v1/batches?start=${START_DATE}&end=${END_DATE}&pageSize=100")

echo "API response received, processing..."

# Check if the response is valid JSON
if ! echo "$response" | jq empty 2>/dev/null; then
  echo "Error: Invalid JSON response from Applitools API"
  echo "Response: $response"
  exit 1
fi

# Collect only batches with matching pointerId and sort them by startedAt
JQ_FILTER='[.batches[] | select(.pointerId == $p)] | sort_by(.startedAt)'
filtered_and_sorted=$(echo "$response" | jq --arg p "$POINTER_ID" "$JQ_FILTER")


count=$(echo "$filtered_and_sorted" | jq 'length')
echo "Found $count batches with pointerId=$POINTER_ID"

if [ "$count" -eq 0 ]; then
  echo "No batch found with pointerId=$POINTER_ID in the last day."
  echo "Setting default outputs for missing batch..."
  {
    echo "foundBatchID="
    echo "needsReview=true"
  } >> "$GITHUB_OUTPUT"
  exit 1
fi

# Grab the newest batch (last element)
latest=$(echo "$filtered_and_sorted" | jq '.[-1]')
batch_id=$(echo "$latest" | jq -r '.id')
passed=$(echo "$latest" | jq -r '.passed')
failed=$(echo "$latest" | jq -r '.failed')
unresolved=$(echo "$latest" | jq -r '.unresolved')

echo "Found Applitools batch: id=$batch_id pointerId=$POINTER_ID"
echo "passed=$passed, failed=$failed, unresolved=$unresolved"

# Write outputs to GitHub Actions environment file
echo "Writing outputs to GITHUB_OUTPUT..."
{
  echo "foundBatchID=$batch_id"
  if [ "$failed" -gt 0 ] || [ "$unresolved" -gt 0 ]; then
    echo "needsReview=true"
    echo "Batch needs review due to failed=$failed, unresolved=$unresolved"
  else
    echo "needsReview=false"
    echo "Batch passed all checks"
  fi
} >> "$GITHUB_OUTPUT"

echo "=== Applitools Batch Check Complete ==="
