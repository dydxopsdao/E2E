#!/usr/bin/env bash
#
# Script: checkApplitoolsBatchByPointer.sh
# Usage: ./checkApplitoolsBatchByPointer.sh <applitools_server_url> <api_key> <pointer_id>
#
# 1. Fetches all batches in the last day.
# 2. Filters to only those whose pointerId == <pointer_id>.
# 3. Takes the first item in that filtered list (assuming the first is the newest).
# 4. Outputs:
#    - foundBatchID=<the real Applitools batch id>
#    - needsReview=true/false
#
# If none are found, it exits with code 1.

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

# Extract only batches whose pointerId == $POINTER_ID
filtered=$(echo "$response" | jq --arg p "$POINTER_ID" '[.batches[] | select(.pointerId == $p)]')

count=$(echo "$filtered" | jq 'length')
if [ "$count" -eq 0 ]; then
  echo "No batch found with pointerId=$POINTER_ID in the last day."
  exit 1
fi

# We assume the first item is the latest
latest=$(echo "$filtered" | jq '.[0]')
batch_id=$(echo "$latest" | jq -r '.id')
batch_status=$(echo "$latest" | jq -r '.status')
unresolved=$(echo "$latest" | jq -r '.unresolved')
new_count=$(echo "$latest" | jq -r '.new')

echo "Found Applitools batch: id=$batch_id pointerId=$POINTER_ID"
echo "Status=$batch_status, unresolved=$unresolved, new=$new_count"

{
  echo "foundBatchID=$batch_id"
  if [ "$batch_status" != "Passed" ] || [ "$unresolved" -gt 0 ] || [ "$new_count" -gt 0 ]; then
    echo "needsReview=true"
  else
    echo "needsReview=false"
  fi
} >> "$GITHUB_OUTPUT"
