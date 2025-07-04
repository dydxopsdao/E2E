#!/usr/bin/env bash
set -euo pipefail

# reusable Slack helper
send_slack_message() {
  local text="$1"
  local payload
  payload=$(jq -n \
    --arg channel "$SLACK_CHANNEL" \
    --arg thread_ts "$ROOT_THREAD_TS" \
    --arg text "$text" \
    '{channel: $channel, thread_ts: $thread_ts, text: $text}')
  curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    --data "$payload" \
    https://slack.com/api/chat.postMessage >/dev/null
}

APPLITOOLS_LINK="https://eyes.applitools.com/app/test-results/${FOUND_BATCH_ID}/"
RUN_URL="https://github.com/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}"

MAX=120
INTERVAL=30
i=0
STATUS=""

while (( i < MAX )); do
  (( i++ ))
  START=$(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%SZ)
  END=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  resp=$(curl -s -H "X-Eyes-Api-Key: $APPLITOOLS_API_KEY" \
    "$APPLITOOLS_SERVER_URL/api/v1/batches?start=${START}&end=${END}&pageSize=100")

  B=$(jq --arg bid "$FOUND_BATCH_ID" '.batches[] | select(.id==$bid)' <<<"$resp")

  if [[ -z "$B" || "$B" == "null" ]]; then
    sleep $INTERVAL
    continue
  fi

  F=$(echo "$B" | jq -r '.runningSummary.failedTests // 0')
  U=$(echo "$B" | jq -r '.runningSummary.unresolvedTests // 0')
  N=$(echo "$B" | jq -r '.runningSummary.newTests // 0')

  if (( F > 0 )); then
    STATUS="FAILED"
    break
  elif (( F==0 && U==0 && N==0 )); then
    STATUS="PASSED"
    break
  else
    sleep $INTERVAL
  fi
done

case "$STATUS" in
  PASSED)
    send_slack_message "✅ *Visual Review Approved* 🎉\nRollout can proceed.\n<$RUN_URL|View Action> | <$APPLITOOLS_LINK|View Applitools>"
    echo "status=approved" >> "$GITHUB_OUTPUT"
    ;;
  FAILED)
    send_slack_message "❌ *Visual Review Rejected* 🚨\nRollout stopped.\n<$RUN_URL|View Action> | <$APPLITOOLS_LINK|View Applitools>"
    echo "status=rejected" >> "$GITHUB_OUTPUT"
    ;;
  *)
    send_slack_message "⚠️ *Review Timed Out* ⏳\nStill unresolved after 1 hour. Please check manually.\n<$RUN_URL|View Action> | <$APPLITOOLS_LINK|View Applitools>"
    echo "status=timeout" >> "$GITHUB_OUTPUT"
    ;;
