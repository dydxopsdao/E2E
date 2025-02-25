export const DealTicketSelectors = {
  marketOrderBtn: "[id$='trigger-MARKET']",
  limitOrderBtn: "[id$='trigger-LIMIT']",
  amountInput: "#trade-amount",
  placeOrderBtnInactive:
    "button.sc-l0nx5c-0.kvCeBH.sc-1xochuw-0.iczSRt.sc-513u37-4.eSofcy",
  placeOrderBtnActive:
    "button.sc-l0nx5c-0.kvCeBH.sc-1xochuw-0.laVUfR.sc-513u37-4.eSofcy",
  swapAssetBtn: ".sc-l0nx5c-0.hXySKe.sc-1t8tdl7-0.eyyfia.sc-11am3s5-0.epGjeL",
  assetSelected: ".sc-dshm8q-0.sc-1711qo3-0.eGHGbY.gdNLGA",

  // Fee & Order Details
  expectedPrice: "dt:has-text('Expected Price') + dd output",
  liquidationPrice:
    "dt:has-text('Liquidation Price') + dd output:has-text('$')",
  positionMargin: "dt:has-text('Position Margin') + dd output:has-text('$')",
  positionLeverage:
    "dt:has-text('Position Leverage') + dd output:has-text('×')",
  fee: "dt:has-text('Fee') + dd output:has-text('$')",
  estimatedRewards:
    "dt:has-text('Estimated Rewards') + dd output[title*='DYDX']",
};
