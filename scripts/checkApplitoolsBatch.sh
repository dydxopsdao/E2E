#!/usr/bin/env bash
# Poll Applitools for up to 1 hour, then update Slack thread and exit with status
set -euo pipefail

# Required environment variables (fail early if missing)
: "${SLACK_CHANNEL:?SLACK_CHANNEL is required}"  # Slack channel ID
: "${MESSAGE_TS:?MESSAGE_TS is required}"        # Slack message timestamp to update
: "${SLACK_BOT_TOKEN:?SLACK_BOT_TOKEN is required}"# Slack bot token
: "${APPLITOOLS_API_KEY:?APPLITOOLS_API_KEY is required}"# Applitools API key
: "${APPLITOOLS_SERVER_URL:?APPLITOOLS_SERVER_URL is required}" # Applitools server URL
: "${FOUND_BATCH_ID:?FOUND_BATCH_ID is required}" # Batch pointer ID
: "${RUN_URL:?RUN_URL is required}" # GitHub run URL
: "${APPLITOOLS_LINK:?APPLITOOLS_LINK is required}" # Link to Applitools batch
: "${DISPLAY:?DISPLAY is required}" # Display label for the pipeline

# Helper: update the existing Slack message
send_slack_update() {
  local text_payload="$1"
  jq -n \
    --arg channel "$SLACK_CHANNEL" \
    --arg ts "$MESSAGE_TS" \
    --arg text "$text_payload" \
    '{channel: $channel, ts: $ts, text: $text}' \
  | curl -s -X POST \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
      --data @- >/dev/null
}

# Poll loop
MAX_ITER=120      # 120 attempts (~1 hour)
INTERVAL=30       # seconds between attempts
count=0
status="timeout"

while (( count < MAX_ITER )); do
  (( count++ ))
  start_time=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)
  end_time=$(date -u +%Y-%m-%dT%H:%M:%SZ)

  # Fetch batches
  response=$(curl -s -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
    "$APPLITOOLS_SERVER_URL/api/v1/batches?start=${start_time}&end=${end_time}&pageSize=100")

  # Ensure valid JSON and 'batches' field
  if ! echo "$response" | jq -e '.batches' >/dev/null 2>&1; then
    echo "Warning: invalid or missing 'batches' in response, retrying..."
    sleep $INTERVAL
    continue
  fi

  # Select our batch
  batch_json=$(echo "$response" \
    | jq --arg id "$FOUND_BATCH_ID" -c '.batches[] | select(.id==$id)') || {
      echo "Warning: jq select error, retrying..."
      sleep $INTERVAL
      continue
    }

  # If not found, retry
  if [[ -z "$batch_json" || "$batch_json" == "null" ]]; then
    sleep $INTERVAL
    continue
  fi

  # Parse runningsummary counts
  failed=$(echo "$batch_json" | jq -r '.runningSummary.failedTests // 0')
  unresolved=$(echo "$batch_json" | jq -r '.runningSummary.unresolvedTests // 0')
  new_tests=$(echo "$batch_json" | jq -r '.runningSummary.newTests // 0')

  # Determine status
  if (( failed > 0 )); then
    status="rejected"
    header="❌ *Visual Review Rejected*"
  elif (( failed==0 && unresolved==0 && new_tests==0 )); then
    status="approved"
    header="✅ *Visual Review Approved*"
  else
    # Pending unresolved or new tests; retry
    sleep $INTERVAL
    continue
  fi

  # Build and send Slack update at 100%
  bar="[████████] 100%%"
  text=$(printf "*E2E Pipeline for:* %s\n>%s | %s\n• <%s|View GitHub Run> | <%s|View Applitools Batch>" \
    "$DISPLAY" "$bar" "$header" "$RUN_URL" "$APPLITOOLS_LINK")
  send_slack_update "$text"

  break

done

# Export final status for GitHub Actions
# e.g. status=approved or rejected or timeout
echo "status=$status" >> "$GITHUB_OUTPUT"
