#!/usr/bin/env bash
#
# Script: checkApplitoolsBatchByPointer.sh
# Usage: ./checkApplitoolsBatchByPointer.sh <applitools_server_url> <api_key> <pointer_id>
#
# 1) Fetches Applitools batches from the last day.
# 2) Filters to find those whose pointerId == <pointer_id>.
# 3) Takes the first item (assuming it's the newest).
# 4) If "failed", "unresolved", or "new" > 0 => needsReview=true, else needsReview=false.

set -e

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
response=$(curl -s -X GET \
  -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
  "${APPLITOOLS_SERVER_URL}/api/v1/batches?start=${START_DATE}&end=${END_DATE}&pageSize=100")

# Filter to only the batches whose pointerId matches $POINTER_ID
filtered=$(echo "$response" | jq --arg p "$POINTER_ID" '[.batches[] | select(.pointerId == $p)]')
count=$(echo "$filtered" | jq 'length')

if [ "$count" -eq 0 ]; then
  echo "No batch found with pointerId=$POINTER_ID in the last day."
  exit 1
fi

# Assume the first item is the newest
latest=$(echo "$filtered" | jq '.[0]')
batch_id=$(echo "$latest" | jq -r '.id')
passed=$(echo "$latest" | jq -r '.passed')
failed=$(echo "$latest" | jq -r '.failed')
unresolved=$(echo "$latest" | jq -r '.unresolved')

echo "Found Applitools batch: id=$batch_id pointerId=$POINTER_ID"
echo "passed=$passed, failed=$failed, unresolved=$unresolved"

{
  echo "foundBatchID=$batch_id"
  if [ "$failed" -gt 0 ] || [ "$unresolved" -gt 0 ]; then
    echo "needsReview=true"
  else
    echo "needsReview=false"
  fi
} >> "$GITHUB_OUTPUT"
