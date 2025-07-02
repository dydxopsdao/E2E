#!/bin/bash
set -e # Exit on error

echo "=== Slack Progress Update Script Start ==="

# --- Input Validation ---
if [ -z "$SLACK_BOT_TOKEN" ]; then
  echo "Error: SLACK_BOT_TOKEN is missing or empty"
  exit 1
fi

if [ -z "$SLACK_CHANNEL" ]; then
  echo "Error: SLACK_CHANNEL is missing or empty"
  exit 1
fi

if [ -z "$MESSAGE_TS" ]; then
  echo "Error: MESSAGE_TS is missing or empty"
  exit 1
fi

if [ -z "$MESSAGE_TEXT" ]; then
  echo "Error: MESSAGE_TEXT is missing or empty"
  exit 1
fi

echo "All required environment variables are present"
echo "SLACK_CHANNEL: $SLACK_CHANNEL"
echo "MESSAGE_TS: $MESSAGE_TS"
echo "MESSAGE_TEXT length: ${#MESSAGE_TEXT} characters"

# --- Use jq to build the JSON payload safely ---
echo "Building JSON payload..."
JSON_PAYLOAD=$(jq -n \
                  --arg channel "$SLACK_CHANNEL" \
                  --arg ts "$MESSAGE_TS" \
                  --arg text "$MESSAGE_TEXT" \
                  '{channel: $channel, ts: $ts, text: $text}')

echo "JSON payload created successfully"

# --- Call the Slack API to update the message ---
echo "Calling Slack API..."
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
  --data "$JSON_PAYLOAD" \
  https://slack.com/api/chat.update)

echo "Slack API response: $RESPONSE"

# Check if the response indicates success
SUCCESS=$(echo "$RESPONSE" | jq -r '.ok // false')
if [ "$SUCCESS" != "true" ]; then
  ERROR_MSG=$(echo "$RESPONSE" | jq -r '.error // "Unknown error"')
  echo "Error: Slack API call failed with error: $ERROR_MSG"
  exit 1
fi

echo "Slack message updated successfully"
echo "=== Slack Progress Update Script End ==="