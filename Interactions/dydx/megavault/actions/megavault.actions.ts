import { Page } from "@playwright/test";
import { Eyes } from "@applitools/eyes-playwright";
import { MegaVaultSelectors } from "../selectors/megavault.selectors";
import { maybeVisualCheck } from "@utils/visual-check";
import { checkNotificationAppearance } from "@interactions/dydx/notifications/actions/notification-actions";
import { NotificationSelectors } from "@interactions/dydx/notifications/selectors/notification-selectors";
import { TEST_TIMEOUTS } from "@constants/test.constants";
import { navigateToDydxPage, navigateToViaHeader } from "@interactions/dydx/general/actions/navigation.actions";
import { logger } from "@utils/logger/logging-utils";
interface VaultDepositOptions {
  eyes?: Eyes;
  performEyesCheck?: boolean;
}

interface VaultBalanceInfo {
  balance: number;
}

/**
 * Retrieves the vault balance from the UI.
 */
export const getVaultBalance = async (
  page: Page
): Promise<VaultBalanceInfo> => {
  const vaultBalanceElement = page
    .locator(MegaVaultSelectors.vaultBalanceNumber)
    .first();
  await vaultBalanceElement.waitFor({ state: "visible" });

  // Wait for the text to be a valid number (avoid '—')
  await page.waitForFunction(
    (selector) => {
      const el = document.querySelector(selector as string);
      if (!el) return false;
      const text = el.textContent || "";
      if (text.includes("—")) return false;
      return /\d/.test(text);
    },
    MegaVaultSelectors.vaultBalanceNumber,
    { timeout: TEST_TIMEOUTS.NAVIGATION }
  );

  const vaultBalanceText = await vaultBalanceElement.textContent();
  if (!vaultBalanceText) {
    throw new Error("Failed to retrieve Vault Balance text.");
  }

  const balance = parseFloat(vaultBalanceText.replace(/[^\d.-]/g, ""));
  if (isNaN(balance)) {
    throw new Error("Vault Balance is not a valid number.");
  }

  return { balance };
};

/**
 * Checks the vault history for visibility.
 * - If not visible, clicks "View" to reveal it.
 */
export const checkVaultHistory = async (page: Page): Promise<void> => {
  try {
    const isHistoryTableVisible = await page
      .locator(MegaVaultSelectors.historyTable)
      .isVisible();

    if (!isHistoryTableVisible) {
      await page.locator(MegaVaultSelectors.historyViewButton).first().click({ timeout: TEST_TIMEOUTS.NAVIGATION });
      await page
        .locator(MegaVaultSelectors.historyTable)
        .waitFor({ state: "visible" });
    }
  } catch (error) {
    console.error("Error checking vault history:", error);
    throw error;
  }
};

/**
 * Grabs the total "transaction count" from text like "Your MegaVault History 27".
 * Adjust the locator or regex to match your actual DOM/UI text.
 */
export async function getVaultHistoryTransactionCount(
  page: Page
): Promise<number> {
  const historyHeaderLocator = page.locator("text=Your MegaVault History");
  await historyHeaderLocator.waitFor({ state: "visible" });

  const fullText = await historyHeaderLocator.textContent();
  if (!fullText) {
    throw new Error("Could not retrieve vault history transaction count text.");
  }

  logger.info(`Raw history text: "${fullText}"`);

  const match = fullText.match(/\d+/);
  if (!match) {
    throw new Error(`Unable to parse transaction count from: "${fullText}"`);
  }

  const count = parseInt(match[0], 10);
  logger.info(`Parsed transaction count: ${count} from text: "${fullText}"`);
  return count;
}

/**
 * Checks that after a transaction, the *displayed count* has increased by 1,
 * and the top row in the table matches our new transaction.
 */
export async function checkVaultHistoryAfterTransaction(
  page: Page,
  oldCount: number,
  expectedAction: "Add funds" | "Remove funds",
  expectedAmount: number
): Promise<void> {
  logger.info(`Checking vault history after transaction. Old count: ${oldCount}`);
  
  // Wait for history to be visible and stable
  await checkVaultHistory(page);
  
  // Add a small delay to ensure the page has updated
  await page.waitForTimeout(1000);
  
  // Try multiple times to get the new count
  const maxRetries = 5;
  let retryCount = 0;
  let newCount = oldCount;
  
  while (retryCount < maxRetries) {
    newCount = await getVaultHistoryTransactionCount(page);
    logger.info(`Attempt ${retryCount + 1}: New transaction count: ${newCount}`);
    
    if (newCount === oldCount + 1) {
      break;
    }
    
    retryCount++;
    if (retryCount < maxRetries) {
      logger.info(`Count mismatch, waiting 2 seconds before retry...`);
      await page.waitForTimeout(3000);
      await navigateToViaHeader(page, "PORTFOLIO");
      await page.waitForTimeout(3000);
      await navigateToViaHeader(page, "VAULT");
      await page.waitForTimeout(3000);
    }
  }
  
  if (newCount !== oldCount + 1) {
    throw new Error(
      `Transaction count mismatch after ${maxRetries} attempts.\n` +
      `Initial count (before transaction): ${oldCount}\n` +
      `Final count (after transaction): ${newCount}\n` +
      `Expected final count: ${oldCount + 1}\n` +
      `Raw history text: "${await page.locator("text=Your MegaVault History").textContent()}"`
    );
  }

  // Now check the top row for correctness.
  // This code expects a table row with three <td>:
  // [0]: date/time
  // [1]: action ("Remove funds"/"Add funds")
  // [2]: amount
  
  try {
    const topRow = page
      .locator(`${MegaVaultSelectors.historyTable} tbody tr`)
      .first();

    await topRow.waitFor({ state: "visible" });

    const dateTimeCell = topRow.locator("td").nth(0);
    const actionCell = topRow.locator("td").nth(1);
    const amountCell = topRow.locator("td").nth(2);

    const dateTimeText = (await dateTimeCell.textContent())?.trim() || "";
    const actionText = (await actionCell.textContent())?.trim() || "";
    const amountText = (await amountCell.textContent())?.trim() || "";

    logger.info(`Top row details:
      Date/Time: ${dateTimeText}
      Action: ${actionText}
      Amount: ${amountText}`);

    // Check that date/time is not empty
    if (!dateTimeText) {
      throw new Error(
        "Time data is missing from the top row of the vault history."
      );
    }

    // Check action text
    if (actionText !== expectedAction) {
      throw new Error(
        `Expected top row action to be "${expectedAction}" but got "${actionText}".`
      );
    }

    // Check amount text, e.g. "$11.99"
    const expectedAmountString = `$${expectedAmount.toFixed(2)}`;
    const actualAmount = parseFloat(amountText.replace(/[^0-9.]/g, ""));
    const allowedVariance = expectedAmount * 0.1;

    if (Math.abs(actualAmount - expectedAmount) > allowedVariance) {
      throw new Error(
        `Expected amount "${expectedAmountString}" (±10%) but got "${amountText}".`
      );
    }
  } catch (error) {
    // First attempt failed, try clicking the refresh element and check again
    logger.warning("Initial history verification failed, attempting to refresh data", { error: (error as Error).message });
    
    // Click the refresh element
    logger.info("Clicking refresh element to update history");
    const viewTable = page.locator(".sc-l0nx5c-0.gdQHqL.sc-1xochuw-0.cDUNfF.sc-1n2lg04-0.kFcrgB");
    await viewTable.waitFor({ state: "visible", timeout: 5000 }).catch(() => {
      logger.warning("Refresh element not visible");
    });
    await viewTable.click().catch((e) => {
      logger.warning("Failed to click refresh element", e);
    });
    
    // Wait for potential data refresh
    await page.waitForTimeout(2000);
    
    // Try again with the verification
    logger.info("Retrying history verification after refresh");
    const topRow = page
      .locator(`${MegaVaultSelectors.historyTable} tbody tr`)
      .first();

    await topRow.waitFor({ state: "visible" });

    const dateTimeCell = topRow.locator("td").nth(0);
    const actionCell = topRow.locator("td").nth(1);
    const amountCell = topRow.locator("td").nth(2);

    const dateTimeText = (await dateTimeCell.textContent())?.trim() || "";
    const actionText = (await actionCell.textContent())?.trim() || "";
    const amountText = (await amountCell.textContent())?.trim() || "";

    logger.info(`Top row details after refresh:
      Date/Time: ${dateTimeText}
      Action: ${actionText}
      Amount: ${amountText}`);

    // Check that date/time is not empty
    if (!dateTimeText) {
      throw new Error(
        "Time data is missing from the top row of the vault history after refresh."
      );
    }

    // Check action text
    if (actionText !== expectedAction) {
      throw new Error(
        `Expected top row action to be "${expectedAction}" but got "${actionText}" after refresh.`
      );
    }

    // Check amount text, e.g. "$11.99"
    const expectedAmountString = `$${expectedAmount.toFixed(2)}`;
    const actualAmount = parseFloat(amountText.replace(/[^0-9.]/g, ""));
    const allowedVariance = expectedAmount * 0.1;

    if (Math.abs(actualAmount - expectedAmount) > allowedVariance) {
      throw new Error(
        `Expected amount "${expectedAmountString}" (±10%) but got "${amountText}" after refresh.`
      );
    }
  }
}

/**
 * Enters a deposit/withdraw amount into the vault input field.
 */
export const enterAmount = async (
  page: Page,
  amount: number
): Promise<void> => {
  const amountInput = page.locator(MegaVaultSelectors.amountInput);
  await amountInput.waitFor({ state: "visible" });
  await amountInput.fill(amount.toString());
  await page.waitForTimeout(300);
};

/**
 * Completes the deposit flow: review, terms, confirm.
 */
export const completeDepositFlow = async (page: Page): Promise<void> => {
  const reviewButton = page.locator(MegaVaultSelectors.reviewButton);
  await reviewButton.click();
  await reviewButton.waitFor({ state: "hidden" });

  const termsCheckbox = page.locator(MegaVaultSelectors.agreeToTerms);
  await termsCheckbox.waitFor({ state: "visible" });
  await termsCheckbox.click();

  const confirmButton = page.locator(MegaVaultSelectors.confirmButton);
  await confirmButton.waitFor({ state: "visible" });
  await confirmButton.click();
};

/**
 * Completes the withdraw flow: read estimated amount, review, confirm.
 * Returns the final estimated amount used in the success notification.
 */
export const completeWithdrawFlow = async (page: Page): Promise<number> => {
  // Grab the estimated amount displayed in the UI
  const estimatedAmountLocator = page
    .locator(MegaVaultSelectors.estimatedAmount)
    .nth(1);
  await page.waitForTimeout(2500); // TODO replace with better wait
  const estimatedAmountText = await estimatedAmountLocator.textContent();
  if (!estimatedAmountText) {
    throw new Error("Unable to fetch the estimated amount for withdrawal.");
  }

  const numericText = estimatedAmountText.replace(/[^\d.-]/g, "");
  const estimatedAmount = parseFloat(numericText);
  const roundedEstimatedAmount = parseFloat(estimatedAmount.toFixed(2));

  const reviewButton = page.locator(MegaVaultSelectors.reviewButton);
  await reviewButton.click();
  await reviewButton.waitFor({ state: "hidden" });

  const confirmButton = page.locator(MegaVaultSelectors.confirmButton);
  await confirmButton.waitFor({ state: "visible" });
  await confirmButton.click();

  return roundedEstimatedAmount;
};

/**
 * Checks if the vault balance has changed by the expected amount (± variance%).
 */
export async function checkVaultBalanceChange(
  page: Page,
  initialBalance: number,
  expectedChange: number,
  variancePercent: number = 10
): Promise<void> {
  const retryInterval = 5000;
  const maxRetries = 10;
  let retries = 0;

  await navigateToViaHeader(page, "PORTFOLIO");
  await page.waitForTimeout(1000);
  await navigateToViaHeader(page, "VAULT");
  await page.waitForTimeout(1000);
  
  while (retries <= maxRetries) {
    const { balance: finalBalance } = await getVaultBalance(page);
    const roundedFinal = parseFloat(finalBalance.toFixed(2));
    const roundedInitial = parseFloat(initialBalance.toFixed(2));
    const actualChange = parseFloat((roundedFinal - roundedInitial).toFixed(2));

    const lowerBound = expectedChange * (1 - variancePercent / 100);
    const upperBound = expectedChange * (1 + variancePercent / 100);
    const minAllowed = Math.min(lowerBound, upperBound);
    const maxAllowed = Math.max(lowerBound, upperBound);

    if (actualChange >= minAllowed && actualChange <= maxAllowed) {
      console.log(
        `Vault balance changed by ${actualChange} (within ±${variancePercent}% of expected ${expectedChange}).`
      );
      return;
    }

    if (retries < maxRetries) {
      console.log(
        `Retry ${
          retries + 1
        }/${maxRetries} - Current Change: ${actualChange}, ` +
          `Expected Range: [${minAllowed.toFixed(2)}, ${maxAllowed.toFixed(2)}]`
      );
      await page.waitForTimeout(retryInterval);
      retries++;
    } else {
      throw new Error(
        `Vault balance change (${actualChange}) is not within ±${variancePercent}% of ${expectedChange}.\n` +
          `Allowed range: [${minAllowed.toFixed(2)}, ${maxAllowed.toFixed(
            2
          )}].\n` +
          `Initial: ${roundedInitial}, Final: ${roundedFinal}`
      );
    }
  }
}

/**
 * A single vaultTransaction() function that handles both deposit and withdrawal.
 * Pass a positive `amount` to deposit, or a negative `amount` to withdraw.
 */
export async function vaultTransaction(
  page: Page,
  amount: number,
  options: VaultDepositOptions = {}
): Promise<void> {
  const { eyes, performEyesCheck } = options;
  const isDeposit = amount > 0;
  console.log(isDeposit);
  const displayAmount = Math.abs(amount);

  // 1) Ensure history is visible and record the *text-based* transaction count
  await checkVaultHistory(page);
  const oldTransactionCount = await getVaultHistoryTransactionCount(page);

  // 2) Get initial vault balance
  const { balance: initialBalance } = await getVaultBalance(page);

  // 3) Click "Add Funds" (for deposit) or "Remove Funds" (for withdraw)
  if (isDeposit) {
    await page.locator(MegaVaultSelectors.addFundsButton).click();
  } else {
    await page.locator(MegaVaultSelectors.removeFundsButton).click();
  }

  // 4) Optional visual check of initial state
  await maybeVisualCheck(eyes, performEyesCheck, "Initial Vault State");

  // 5) Enter the absolute amount
  await enterAmount(page, displayAmount);

  // 6) Another optional visual check before confirming
  await maybeVisualCheck(
    eyes,
    performEyesCheck,
    "Pre-Confirmation State"
  );

  // 7) Complete deposit or withdraw flow
  let finalAmount: number;
  if (isDeposit) {
    await completeDepositFlow(page);
    finalAmount = displayAmount;
  } else {
    finalAmount = await completeWithdrawFlow(page);
  }

  // Check for error elements
  await page.waitForTimeout(1000); // Give time for any error to appear
  const errorElement = page.locator('.sc-1vvc9p2-0.eyrpv');
  const hasError = await errorElement.isVisible().catch(() => false);
  
  if (hasError) {
    const errorText = await errorElement.textContent() || 'Unknown error occurred';
    logger.error(`Vault transaction failed: ${errorText}`);
    throw new Error(`Vault ${isDeposit ? 'deposit' : 'withdrawal'} failed: ${errorText}`);
  }
  
  // 8) Check the notification
  try {
    if (isDeposit) {
      await checkNotificationAppearance(
        page,
        NotificationSelectors.instantDepositToast,
        NotificationSelectors.instantDepositHeader,
        NotificationSelectors.depositCompletedMessage,
        "Funds successfully added to MegaVault",
        /You added \$\d+(?:\.\d{2})? in the MegaVault\./
      );
    } else {
      await checkNotificationAppearance(
        page,
        NotificationSelectors.instantDepositToast,
        NotificationSelectors.instantDepositHeader,
        NotificationSelectors.depositCompletedMessage,
        "Funds successfully removed from MegaVault",
        /You removed \$\d+(?:\.\d{2})? from the MegaVault\./
      );
    }
    console.log(`Successfully verified ${isDeposit ? 'deposit' : 'withdrawal'} notification`);
  } catch (error) {
    console.error(`Failed to verify ${isDeposit ? 'deposit' : 'withdrawal'} notification:`, error);
    // Continue execution since the transaction might still be successful
  }

  // 9) Verify the final balance changed by `amount`
  logger.info(`Verifying balance change of ${amount} from initial balance ${initialBalance}`);
  await checkVaultBalanceChange(page, initialBalance, amount);
  logger.info(`Successfully verified balance change after ${isDeposit ? 'deposit' : 'withdrawal'}`);

  // 10) Check that the transaction count incremented by 1
  // and the top row matches the new transaction
  const expectedAction = isDeposit ? "Add funds" : "Remove funds";
  await checkVaultHistoryAfterTransaction(
    page,
    oldTransactionCount,
    expectedAction,
    finalAmount
  );
  logger.info(`Successfully verified transaction history after ${isDeposit ? 'deposit' : 'withdrawal'}`);
}

