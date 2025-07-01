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

# 1) Collect only batches with matching pointerId
# 2) Sort them by .startedAt ascending
# 3) Then pick the last entry (the newest batch)
filtered_and_sorted=$(
  echo "$response" \
    | jq --arg p "$POINTER_ID" \
        '[.batches[]                       # array of all batches
           | select(.pointerId == $p)      # filter on your pointer
         ]
         | sort_by(.startedAt)'           # oldest → newest
)

count=$(echo "$filtered_and_sorted" | jq 'length')
if [ "$count" -eq 0 ]; then
  echo "No batch found with pointerId=$POINTER_ID in the last day."
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

{
  echo "foundBatchID=$batch_id"
  if [ "$failed" -gt 0 ] || [ "$unresolved" -gt 0 ]; then
    echo "needsReview=true"
  else
    echo "needsReview=false"
  fi
} >> "$GITHUB_OUTPUT"
