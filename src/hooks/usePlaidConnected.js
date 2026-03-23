import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

/**
 * Plaid Integration Hook
 * Handles bank connections and transaction fetching
 */
export function usePlaid() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [linkedAccounts, setLinkedAccounts] = useState([])

  /**
   * Create Plaid Link token for connection flow
   */
  const createLinkToken = async (userId) => {
    setLoading(true)
    setError(null)

    try {
      const createLinkTokenFn = httpsCallable(functions, 'createPlaidLinkToken')
      const result = await createLinkTokenFn({ userId })
      return result.data.linkToken
    } catch (err) {
      const errorMsg = err.message || 'Failed to create Plaid link token'
      setError(errorMsg)
      console.error('Plaid link token error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Exchange public token for access token
   */
  const exchangePublicToken = async (publicToken, userId) => {
    setLoading(true)
    setError(null)

    try {
      const exchangeTokenFn = httpsCallable(functions, 'exchangePlaidPublicToken')
      const result = await exchangeTokenFn({
        publicToken,
        userId
      })

      return {
        itemId: result.data.itemId,
        accountIds: result.data.accountIds,
        accountNames: result.data.accountNames
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to connect bank account'
      setError(errorMsg)
      console.error('Token exchange error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  /**
   * Fetch transactions from connected bank
   */
  const fetchTransactions = async (userId, startDate, endDate) => {
    setLoading(true)
    setError(null)

    try {
      const getTransactionsFn = httpsCallable(functions, 'getPlaidTransactions')
      const result = await getTransactionsFn({
        userId,
        startDate,
        endDate
      })

      return result.data.transactions || []
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch transactions'
      setError(errorMsg)
      console.error('Fetch transactions error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get account balances
   */
  const getAccountBalances = async (userId) => {
    setLoading(true)
    setError(null)

    try {
      const getBalancesFn = httpsCallable(functions, 'getPlaidBalances')
      const result = await getBalancesFn({ userId })

      setLinkedAccounts(result.data.accounts || [])
      return result.data.accounts
    } catch (err) {
      const errorMsg = err.message || 'Failed to fetch account balances'
      setError(errorMsg)
      console.error('Get balances error:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  /**
   * Remove linked account
   */
  const unlinkAccount = async (userId, itemId) => {
    setLoading(true)
    setError(null)

    try {
      const unlinkFn = httpsCallable(functions, 'unlinkPlaidAccount')
      await unlinkFn({ userId, itemId })

      // Refresh account list
      await getAccountBalances(userId)
    } catch (err) {
      const errorMsg = err.message || 'Failed to unlink account'
      setError(errorMsg)
      console.error('Unlink error:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    linkedAccounts,
    createLinkToken,
    exchangePublicToken,
    fetchTransactions,
    getAccountBalances,
    unlinkAccount
  }
}
