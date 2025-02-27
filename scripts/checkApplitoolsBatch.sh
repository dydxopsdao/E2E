#!/usr/bin/env bash
#
# Script: checkApplitoolsBatch.sh
# Usage: ./checkApplitoolsBatch.sh <applitools_server_url> <api_key> <batch_id>
#
# This queries the /api/v1/batches endpoint, finds the batch with matching <batch_id>,
# and prints "true" if manual review is needed, otherwise "false".
#
# Exit code 0 is success. The script always prints "true" or "false" at the end.

set -e

APPLITOOLS_SERVER_URL="$1"
APPLITOOLS_API_KEY="$2"
APPLITOOLS_BATCH_ID="$3"

if [ -z "$APPLITOOLS_SERVER_URL" ] || [ -z "$APPLITOOLS_API_KEY" ] || [ -z "$APPLITOOLS_BATCH_ID" ]; then
  echo "Usage: $0 <applitools_server_url> <api_key> <batch_id>"
  exit 1
fi

# We'll search from 1 day ago to now. Adjust as needed.
START_DATE="$(date -u -d '1 day ago' +%Y-%m-%dT%H:%M:%SZ)"
END_DATE="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

echo "Checking Applitools batch: $APPLITOOLS_BATCH_ID"
echo "Time range: $START_DATE to $END_DATE"

# Fetch up to 100 batches in the given time range
response=$(curl -s -X GET \
  -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
  "${APPLITOOLS_SERVER_URL}/api/v1/batches?start=${START_DATE}&end=${END_DATE}&pageSize=100")

# Filter the JSON to find the batch with ID == APPLITOOLS_BATCH_ID
batch_json=$(echo "$response" | jq -c --arg BID "$APPLITOOLS_BATCH_ID" '.batches[] | select(.id == $BID)')

if [ -z "$batch_json" ]; then
  echo "No batch found with ID $APPLITOOLS_BATCH_ID in the last day."
  # If we can't find the batch, assume we need review to be safe:
  echo "true"
  exit 0
fi

batch_status=$(echo "$batch_json" | jq -r '.status')
unresolved=$(echo "$batch_json" | jq -r '.unresolved')
new_count=$(echo "$batch_json" | jq -r '.new')

echo "Batch status: $batch_status"
echo "Unresolved tests: $unresolved"
echo "New tests: $new_count"

# If status != Passed or there's unresolved/new tests, we need manual review
if [ "$batch_status" != "Passed" ] || [ "$unresolved" -gt 0 ] || [ "$new_count" -gt 0 ]; then
  echo "true"
else
  echo "false"
fi
