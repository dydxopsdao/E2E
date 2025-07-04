#!/usr/bin/env bash
# Poll Applitools for up to 1 hour, then update the Slack thread and exit with status
set -euo pipefail

# Ensure required environment variables are set
: "${SLACK_CHANNEL:?SLACK_CHANNEL is required}"  # e.g. C07VDF07WLU
: "${MESSAGE_TS:?MESSAGE_TS is required}"        # Slack message timestamp to update
: "${SLACK_BOT_TOKEN:?SLACK_BOT_TOKEN is required}"
: "${APPLITOOLS_API_KEY:?APPLITOOLS_API_KEY is required}"
: "${APPLITOOLS_SERVER_URL:?APPLITOOLS_SERVER_URL is required}"
: "${FOUND_BATCH_ID:?FOUND_BATCH_ID is required}"
: "${RUN_URL:?RUN_URL is required}"
: "${APPLITOOLS_LINK:?APPLITOOLS_LINK is required}"
: "${DISPLAY:?DISPLAY is required}"                # Display label for the pipeline

# Helper to send (update) Slack message in the existing thread
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
      --data @- \
      https://slack.com/api/chat.update \
    >/dev/null
}

# Poll parameters
MAX_ITER=120     # 120 attempts
INTERVAL=30      # seconds between attempts
count=0
status="timeout"

while (( count < MAX_ITER )); do
  (( count++ ))
  start_time="$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)"
  end_time="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  
  # Fetch batches in time window
  response=$(curl -s -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
    "$APPLITOOLS_SERVER_URL/api/v1/batches?start=${start_time}&end=${end_time}&pageSize=100")
  
  # Extract our batch entry
  batch_json=$(jq --arg id "$FOUND_BATCH_ID" '.batches[] | select(.id==$id)' <<<"$response")
  
  # If not found, wait and retry
  if [[ -z "$batch_json" || "$batch_json" == "null" ]]; then
    sleep $INTERVAL
    continue
  fi
  
  # Parse counts
  failed=$(echo "$batch_json" | jq -r '.runningSummary.failedTests // 0')
  unresolved=$(echo "$batch_json" | jq -r '.runningSummary.unresolvedTests // 0')
  new_tests=$(echo "$batch_json" | jq -r '.runningSummary.newTests // 0')
  
  # Decide status and header
  if (( failed > 0 )); then
    status="rejected"
    header="❌ *Visual Review Rejected*"
  elif (( failed==0 && unresolved==0 && new_tests==0 )); then
    status="approved"
    header="✅ *Visual Review Approved*"
  else
    # Still pending new or unresolved tests
    sleep $INTERVAL
    continue
  fi
  
  # Build updated progress message
  body=$(printf "%s\n• <%s|View GitHub Run> | <%s|View Applitools Batch>" \
    "$header" "$RUN_URL" "$APPLITOOLS_LINK")
  text=$(printf "*E2E Pipeline for:* %s\n> [████████] 100%% | %s\n%s" \
    "$DISPLAY" "$header" "$body")
  
  # Send the update
  send_slack_update "$text"
  
  # Exit loop early
  break
  done

# Export final status for GitHub Actions
# e.g. status=approved, rejected, or timeout
{
  echo "status=$status"
} >> "$GITHUB_OUTPUT"

exit 0
