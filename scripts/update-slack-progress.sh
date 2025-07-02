#!/bin/bash
set -e # Exit on error


# --- Input Validation ---
if [ -z "$SLACK_BOT_TOKEN" ] || [ -z "$SLACK_CHANNEL" ] || [ -z "$MESSAGE_TS" ] || [ -z "$MESSAGE_TEXT" ]; then
  echo "Error: One or more required environment variables are missing."
  echo "Usage: Set SLACK_BOT_TOKEN, SLACK_CHANNEL, MESSAGE_TS, and MESSAGE_TEXT"
  exit 1
fi

# --- Use jq to build the JSON payload safely ---
JSON_PAYLOAD=$(jq -n \
                  --arg channel "$SLACK_CHANNEL" \
                  --arg ts "$MESSAGE_TS" \
                  --arg text "$MESSAGE_TEXT" \
                  '{channel: $channel, ts: $ts, text: $text}')

# --- Call the Slack API to update the message ---
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  --data "$JSON_PAYLOAD" \
  https://slack.com/api/chat.update > /dev/null