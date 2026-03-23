import { useState } from 'react'

/**
 * Plaid Integration Hook
 * Calls backend API endpoints (Express server on Vercel)
 */
export function usePlaid() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [linkedAccounts, setLinkedAccounts] = useState([])

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  /**
   * Create Plaid Link token for connection flow
   */
  const createLinkToken = async (userId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/create_link_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to create Plaid link token')
      }

      const data = await response.json()
      return data.link_token
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
   * Exchange public token for secure token
   */
  const exchangePublicToken = async (publicToken, userId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/api/exchange_public_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token: publicToken, userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to connect bank account')
      }

      const data = await response.json()
      return {
        secureToken: data.secure_token,
        status: data.status
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
   * Requires MFA token from user session
   */
  const fetchTransactions = async (secureToken) => {
    setLoading(true)
    setError(null)

    try {
      // Get MFA token from headers or session
      const mfaToken = sessionStorage.getItem('mfa_token') || 'user_authenticated'

      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secure_token: secureToken,
          mfa_token: mfaToken
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const transactions = await response.json()
      return transactions || []
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
   * Get account balances (placeholder - integrate with backend if needed)
   */
  const getAccountBalances = async () => {
    setLoading(true)
    setError(null)

    try {
      // For now, return empty array
      // You can extend the backend with a /api/balances endpoint if needed
      setLinkedAccounts([])
      return []
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
   * Remove linked account (placeholder)
   */
  const unlinkAccount = async () => {
    setLoading(true)
    setError(null)

    try {
      // Implement when you add delete endpoint to backend
      setLinkedAccounts([])
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
