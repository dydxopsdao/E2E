export const DealTicketSelectors = {
  marketOrderBtn: "[id$='trigger-MARKET']",
  limitOrderBtn: "[id$='trigger-LIMIT']",
  amountInput: "#trade-amount",
  placeOrderBtnInactive:"button:has-text('Enter amount')",
  placeOrderBtnActive:
    "button.sc-l0nx5c-0.etvDqn.sc-1xochuw-0.ePmoNb.sc-513u37-5.kRaPnM",
  closePositionBtn:
    "button.sc-l0nx5c-0.disEvY.sc-1xochuw-0.lkayIT.sc-513u37-4.eSofcy",
  swapAssetBtn: ".sc-l0nx5c-0.ergVgG.sc-1t8tdl7-0.fUjRkd.sc-11am3s5-0.gOOlRj",
  assetSelected: ".sc-dshm8q-0.sc-1711qo3-0.RegAL.kzlJbD",

  // Fee & Order Details
  expectedPrice: "dt:has-text('Expected Price') + dd output",
  liquidationPrice:
    "dt:has-text('Liquidation Price') + dd output:has-text('$')",
  positionMargin: "dt:has-text('Position Margin') + dd output:has-text('$')",
  positionLeverage:
    "dt:has-text('Position Leverage') + dd output:has-text('×')",
  fee: "dt:has-text('Fee') + dd output:has-text('$')",
  estimatedRewards:
    "dt:has-text('Rewards') + dd output[title*='DYDX']",
};
