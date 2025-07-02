#!/bin/bash
set -e # Exit on error

# --- Arguments ---
SLACK_BOT_TOKEN="$1"
CHANNEL_ID="$2"
MESSAGE_TS="$3"
MESSAGE_TEXT="$4"

# --- Input Validation ---
if [ -z "$SLACK_BOT_TOKEN" ] || [ -z "$CHANNEL_ID" ] || [ -z "$MESSAGE_TS" ] || [ -z "$MESSAGE_TEXT" ]; then
  echo "Usage: $0 <slack_bot_token> <channel_id> <message_ts> <message_text>"
  exit 1
fi

# --- Use jq to build the JSON payload safely ---
# This avoids issues with special characters in the message text.
JSON_PAYLOAD=$(jq -n \
                  --arg channel "$CHANNEL_ID" \
                  --arg ts "$MESSAGE_TS" \
                  --arg text "$MESSAGE_TEXT" \
                  '{channel: $channel, ts: $ts, text: $text}')

# --- Call the Slack API to update the message ---
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  --data "$JSON_PAYLOAD" \
  https://slack.com/api/chat.update > /dev/null # Discard API response