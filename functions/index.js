/**
 * Main Firebase Cloud Functions entry point
 * Exports all functions from ai and plaid modules
 */

// Import AI functions
const aiCoachFunctions = require('./ai/coach')

// Import Plaid functions
const plaidFunctions = require('./plaid/index')

// Export all functions
module.exports = {
  // Coach functions
  coachChat: aiCoachFunctions.coachChat,
  generateWeeklyReport: aiCoachFunctions.generateWeeklyReport,

  // Plaid functions
  createPlaidLinkToken: plaidFunctions.createPlaidLinkToken,
  exchangePlaidPublicToken: plaidFunctions.exchangePlaidPublicToken,
  getPlaidTransactions: plaidFunctions.getPlaidTransactions,
  getPlaidBalances: plaidFunctions.getPlaidBalances,
  unlinkPlaidAccount: plaidFunctions.unlinkPlaidAccount,
}
