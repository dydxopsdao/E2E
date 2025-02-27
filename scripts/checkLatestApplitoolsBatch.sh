#!/usr/bin/env bash
#
# Script: checkLatestApplitoolsBatch.sh
# Usage: ./checkLatestApplitoolsBatch.sh <applitools_server_url> <api_key>
#
# 1. Calls GET /api/v1/batches (the Applitools "List Batches" endpoint) for the last day.
# 2. Assumes the FIRST item in the "batches" array is the LATEST batch.
# 3. Outputs:
#     - latestBatchID=<the ID of the first batch>
#     - needsReview=true/false
# via GitHub Actions environment outputs.

set -e

APPLITOOLS_SERVER_URL="$1"
APPLITOOLS_API_KEY="$2"

if [ -z "$APPLITOOLS_SERVER_URL" ] || [ -z "$APPLITOOLS_API_KEY" ]; then
  echo "Usage: $0 <applitools_server_url> <api_key>"
  exit 1
fi

# We'll look back 1 day. Adjust as needed.
START_DATE="$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)"
END_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "Fetching Applitools batches from $START_DATE to $END_DATE..."

response=$(curl -s -X GET \
  -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
  "${APPLITOOLS_SERVER_URL}/api/v1/batches?start=${START_DATE}&end=${END_DATE}&pageSize=100")

# If no batches are returned, exit with an error
count=$(echo "$response" | jq '.batches | length')
if [ "$count" -eq 0 ]; then
  echo "No batches found in the last day."
  exit 1
fi

# The first item in the array is the latest batch
latest_batch=$(echo "$response" | jq '.batches[0]')
latest_batch_id=$(echo "$latest_batch" | jq -r '.id')
batch_status=$(echo "$latest_batch" | jq -r '.status')
unresolved=$(echo "$latest_batch" | jq -r '.unresolved')
new_count=$(echo "$latest_batch" | jq -r '.new')

echo "Latest batch ID: $latest_batch_id"
echo "Status: $batch_status, unresolved=$unresolved, new=$new_count"

# Write outputs to GitHub Actions environment file
# https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions#setting-an-output-parameter
{
  echo "latestBatchID=$latest_batch_id"
  if [ "$batch_status" != "Passed" ] || [ "$unresolved" -gt 0 ] || [ "$new_count" -gt 0 ]; then
    echo "needsReview=true"
  else
    echo "needsReview=false"
  fi
} >> "$GITHUB_OUTPUT"
