name: E2E Pipeline

on:
  workflow_dispatch:
    inputs:
      deployment_id:
        description: 'Deployment ID'
        required: false
        default: 'manual'
  push:
    branches: [main]
  pull_request:
    branches: [main]

# Global environment
env:
  APPLITOOLS_API_KEY: ${{ secrets.APPLITOOLS_API_KEY }}
  APPLITOOLS_SERVER_URL: https://eyesapi.applitools.com

jobs:
  e2e-test:
    name: "E2E Tests (Deployment: ${{ inputs.deployment_id }})"
    runs-on: self-hosted

    # Provide a stable APPLITOOLS_BATCH_ID so Applitools doesn't throw an error.
    env:
      # For a PR, we use pull_request.head.sha; otherwise we fallback to github.sha.
      APPLITOOLS_BATCH_ID: ${{ github.event.pull_request.head.sha || github.sha }}

      # Additional env vars for your tests
      NORDLAYER_EMAIL: ${{ secrets.NORDLAYER_EMAIL }}
      NORDLAYER_PASSWORD: ${{ secrets.NORDLAYER_PASSWORD }}
      SEED_PHRASE: ${{ secrets.SEED_PHRASE }}
      METAMASK_PASSWORD: ${{ secrets.METAMASK_PASSWORD }}
      DD_API_KEY: ${{ secrets.DD_API_KEY }}
      DD_SITE: ap1.datadoghq.com
      DD_SERVICE: dydx.trade
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      DYDX_MNEMONIC: ${{ secrets.DYDX_MNEMONIC }}
      DYDX_ADDRESS: ${{ secrets.DYDX_ADDRESS }}
      DYDX_NETWORK_TYPE: mainnet
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
      SLACK_CHANNEL: "#automated-testing-results"

    outputs:
      slack_ts: ${{ steps.slack-notify.outputs.slack_ts }}
      needs_review: ${{ steps.check-batch.outputs.needsReview }}
      found_batch_id: ${{ steps.check-batch.outputs.foundBatchID }}

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Install Dependencies
        run: |
          npm install
          npx playwright install chromium

      - name: Start Xvfb
        run: |
          Xvfb :99 -ac &>/dev/null &
          echo "DISPLAY=:99" >> $GITHUB_ENV
          sleep 3

      - name: Run E2E Tests (Playwright + Applitools)
        run: |
          PLAYWRIGHT_JUNIT_OUTPUT=results.xml \
          xvfb-run --auto-servernum --server-args='-screen 0 1920x1080x24' \
          npx playwright test
        # If tests fail, we won't check Applitools, but Slack will still notify.

      # Upload test report artifacts if needed
      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-test-report-${{ github.run_id }}
          path: playwright-report/

      # Optionally upload results to Datadog
      - name: Upload Test Results to Datadog
        if: always()
        run: |
          if [ -f results.xml ]; then
            echo "Uploading results.xml to Datadog..."
            # e.g. datadog-ci junit upload results.xml --service "$DD_SERVICE"
          else
            echo "results.xml not found, skipping Datadog upload."
          fi

      # Only check Applitools if E2E tests passed
      - name: Check Applitools Batch By Pointer
        if: success()
        id: check-batch
        run: |
          chmod +x scripts/checkApplitoolsBatchByPointer.sh
          ./scripts/checkApplitoolsBatchByPointer.sh \
            "${APPLITOOLS_SERVER_URL}" \
            "${APPLITOOLS_API_KEY}" \
            "${APPLITOOLS_BATCH_ID}"

      # Post Slack Notification (always runs, includes logic for pass/fail + Applitools status)
      - name: Post Slack Notification (Main Message)
        id: slack-notify
        if: always()
        env:
          RUN_URL: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}
          JOB_STATUS: ${{ job.status }}  # success/failure for E2E tests
          DEPLOYMENT_ID: ${{ inputs.deployment_id }}
          SLACK_BOT_TOKEN: ${{ secrets.SLACK_BOT_TOKEN }}
          SLACK_CHANNEL: "#automated-testing-results"
          NEEDS_REVIEW: ${{ steps.check-batch.outputs.needsReview || 'false' }}
          FOUND_BATCH_ID: ${{ steps.check-batch.outputs.foundBatchID || '' }}
        run: |
          if [ "${JOB_STATUS}" = "success" ]; then
            # E2E tests passed
            if [ "${NEEDS_REVIEW}" = "true" ]; then
              # Applitools found differences
              MESSAGE="Deployment ID: ${DEPLOYMENT_ID}\n\n✅ E2E Tests Passed!\nHowever, visual tests need manual review.\nView Applitools: https://eyes.applitools.com/app/test-results/${FOUND_BATCH_ID}/"
            else
              # Applitools is all good (or check-batch didn't run)
              MESSAGE="Deployment ID: ${DEPLOYMENT_ID}\n\n✅ E2E Tests Passed!\nAll visual checks passed. Rollout can proceed."
            fi
          else
            # E2E tests failed
            MESSAGE="Deployment ID: ${DEPLOYMENT_ID}\n\n❌ E2E Tests Failed!\nDetails: ${RUN_URL}"
          fi

          RESPONSE=$(curl -s -X POST \
            -H "Content-type: application/json" \
            -H "Authorization: Bearer ${SLACK_BOT_TOKEN}" \
            --data "{
              \"channel\": \"${SLACK_CHANNEL}\",
              \"text\": \"${MESSAGE}\"
            }" \
            https://slack.com/api/chat.postMessage)

          TS=$(echo "$RESPONSE" | jq -r '.ts')
          echo "::set-output name=slack_ts::$TS"

  # If Applitools is all good, auto-complete the batch
  applitools-auto-complete:
    name: "Applitools Auto-Completion"
    if: needs.e2e-test.outputs.needs_review == 'false'
    needs: e2e-test
    runs-on: ubuntu-latest

    steps:
      - name: Mark Applitools Batch as Complete
        run: |
          echo "No review needed, auto-completing the batch."
          curl -X POST -d '' -H "accept:*/*" \
            "${{ env.APPLITOOLS_SERVER_URL }}/api/externals/github/servers/github.com/commit/${{ needs.e2e-test.outputs.found_batch_id }}/complete?apiKey=${{ env.APPLITOOLS_API_KEY }}"

      # Optional Slack thread message if you want
      # - name: Post Slack Thread (No Manual Review)
      #   ...

  # If Applitools has differences, require environment approval
  batch-completion-notification:
    name: "Applitools Batch Completion Notification"
    if: needs.e2e-test.outputs.needs_review == 'true'
    needs: e2e-test
    runs-on: ubuntu-latest
    environment:
      name: applitools-review  # Create this environment in repo settings, require manual approval
    steps:
      - name: Pause for Manual Review
        run: |
          echo "Paused: Applitools found differences. Approve environment to continue."

      - name: Update Applitools Batch Status
        run: |
          echo "Completing the batch after manual approval."
          curl -X POST -d '' -H "accept:*/*" \
            "${{ env.APPLITOOLS_SERVER_URL }}/api/externals/github/servers/github.com/commit/${{ needs.e2e-test.outputs.found_batch_id }}/complete?apiKey=${{ env.APPLITOOLS_API_KEY }}"
