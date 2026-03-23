/**
 * Firebase Cloud Functions for Plaid Integration
 * Deploy as: firebase deploy --only functions
 * 
 * Setup:
 * 1. npm install plaid@latest
 * 2. Set PLAID_CLIENT_ID and PLAID_SECRET in Firebase config
 * 3. Deploy this function
 */

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid')

admin.initializeApp()
const db = admin.firestore()

// Configure Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments.production, // Use 'sandbox' for testing
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
})

const client = new PlaidApi(configuration)

/**
 * Create a Plaid Link token
 * User calls Plaid Link with this token
 */
exports.createPlaidLinkToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const userId = context.auth.uid

  try {
    const request = {
      user: { client_user_id: userId },
      client_name: 'Serant Wealth Plan',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    }

    const response = await client.linkTokenCreate(request)

    return {
      linkToken: response.data.link_token,
    }
  } catch (error) {
    console.error('Link token creation error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to create Plaid link token'
    )
  }
})

/**
 * Exchange public token for access token
 * Called after user completes Plaid Link flow
 */
exports.exchangePlaidPublicToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const { publicToken } = data
  const userId = context.auth.uid

  if (!publicToken) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Public token is required'
    )
  }

  try {
    // Exchange public token for access token
    const exchangeResponse = await client.itemPublicTokenExchange({
      public_token: publicToken,
    })

    const accessToken = exchangeResponse.data.access_token
    const itemId = exchangeResponse.data.item_id

    // Get account info
    const accountsResponse = await client.accountsGet({
      access_token: accessToken,
    })

    const accounts = accountsResponse.data.accounts

    // Store access token securely in Firestore
    await db.collection('users').doc(userId).collection('plaidItems').add({
      itemId,
      accessToken,
      accountIds: accounts.map((a) => a.account_id),
      accountNames: accounts.map((a) => a.name),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // Get initial balances
    await fetchAndStoreBalances(accessToken, userId, itemId)

    return {
      itemId,
      accountIds: accounts.map((a) => a.account_id),
      accountNames: accounts.map((a) => a.name),
    }
  } catch (error) {
    console.error('Token exchange error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to connect bank account'
    )
  }
})

/**
 * Fetch transactions from Plaid
 */
exports.getPlaidTransactions = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const { startDate, endDate } = data
  const userId = context.auth.uid

  try {
    // Get all Plaid access tokens for user
    const itemsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get()

    let allTransactions = []

    for (const itemDoc of itemsSnap.docs) {
      const { accessToken } = itemDoc.data()

      try {
        const response = await client.transactionsGet({
          access_token: accessToken,
          start_date: startDate,
          end_date: endDate,
        })

        const transactions = response.data.transactions.map((t) => ({
          id: t.transaction_id,
          plaidId: t.transaction_id,
          merchant: t.merchant_name || t.name,
          amount: t.amount,
          date: t.date,
          category: t.personal_finance_category?.primary || 'Other',
          pending: t.pending,
          accountId: t.account_id,
          userId,
          importedAt: new Date().toISOString(),
          budgetCategory: null, // Will be set by user
        }))

        allTransactions = allTransactions.concat(transactions)
      } catch (err) {
        console.error('Error fetching transactions for item:', err)
      }
    }

    // Store transactions in Firestore
    for (const tx of allTransactions) {
      await db.collection('transactions').add(tx)
    }

    return {
      transactions: allTransactions,
      count: allTransactions.length,
    }
  } catch (error) {
    console.error('Get transactions error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch transactions'
    )
  }
})

/**
 * Get account balances
 */
exports.getPlaidBalances = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const userId = context.auth.uid

  try {
    const itemsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .get()

    const accounts = []

    for (const itemDoc of itemsSnap.docs) {
      const { accessToken, accountNames, accountIds } = itemDoc.data()

      try {
        const response = await client.accountsBalanceGet({
          access_token: accessToken,
        })

        response.data.accounts.forEach((account, idx) => {
          accounts.push({
            id: account.account_id,
            name: accountNames[idx] || account.name,
            balance: account.balances.current,
            type: account.subtype,
          })
        })
      } catch (err) {
        console.error('Error fetching balances:', err)
      }
    }

    return { accounts }
  } catch (error) {
    console.error('Get balances error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to fetch account balances'
    )
  }
})

/**
 * Remove linked Plaid account
 */
exports.unlinkPlaidAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const { itemId } = data
  const userId = context.auth.uid

  try {
    // Find and delete item
    const itemsSnap = await db
      .collection('users')
      .doc(userId)
      .collection('plaidItems')
      .where('itemId', '==', itemId)
      .get()

    for (const doc of itemsSnap.docs) {
      await doc.ref.delete()
    }

    return { success: true }
  } catch (error) {
    console.error('Unlink error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to unlink account'
    )
  }
})

/**
 * Helper: Fetch and store account balances
 */
async function fetchAndStoreBalances(accessToken, userId, itemId) {
  try {
    const response = await client.accountsBalanceGet({
      access_token: accessToken,
    })

    const accountsData = response.data.accounts.map((account) => ({
      userId,
      itemId,
      accountId: account.account_id,
      name: account.name,
      balance: account.balances.current,
      available: account.balances.available,
      type: account.subtype,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }))

    // Store in Firestore
    for (const account of accountsData) {
      await db.collection('accounts').add(account)
    }
  } catch (error) {
    console.error('Store balances error:', error)
  }
}
