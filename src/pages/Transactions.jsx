import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useApp } from '../context/AppContext'
import { usePlaid } from '../hooks/usePlaidConnected'
import { autoTagTransaction, getAllCategories, suggestCategory } from '../lib/categorization'
import { db } from '../firebase'
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore'

function fmt(n) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function TaggingModal({ transaction, onSave, onClose, categories }) {
  const [selectedCategory, setSelectedCategory] = useState(transaction.budgetCategory || autoTagTransaction(transaction.merchant))
  const suggested = suggestCategory(transaction.merchant)

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-surface border border-outline-variant rounded-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
      >
        <h3 className="font-headline font-bold text-on-surface mb-1">{transaction.merchant}</h3>
        <p className="text-gray-400 text-sm mb-4">{fmt(transaction.amount)} on {transaction.date}</p>

        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
            Suggested: {suggested.category} ({suggested.confidence}%)
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 font-body text-sm text-on-surface outline-none"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors font-body text-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(selectedCategory)}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors font-body text-sm font-bold"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function PlaidLinkButton({ onSuccess }) {
  const { createLinkToken } = usePlaid()
  const { user } = useAuth()

  const handlePlaidLink = async () => {
    if (!window.Plaid) {
      alert('Plaid SDK not loaded. Please reload the page.')
      return
    }

    try {
      const linkToken = await createLinkToken(user.uid)
      
      window.Plaid.create({
        token: linkToken,
        onSuccess: (public_token, metadata) => {
          onSuccess(public_token)
        },
        onExit: (err, metadata) => {
          if (err) console.error('Plaid error:', err)
        },
      }).open()
    } catch (error) {
      console.error('Link token error:', error)
      alert('Failed to connect bank')
    }
  }

  return (
    <button
      onClick={handlePlaidLink}
      className="px-6 py-3 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors font-body font-bold flex items-center gap-2"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance</span>
      Connect Bank Account
    </button>
  )
}

export default function Transactions() {
  const { user } = useAuth()
  const { budgets } = useApp()
  const { 
    linkedAccounts, 
    fetchTransactions, 
    exchangePublicToken,
    getAccountBalances 
  } = usePlaid()

  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  })

  const categories = getAllCategories()

  // Fetch transactions from Firestore
  useEffect(() => {
    if (!user) return

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', user.uid)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTransactions(txs)
    })

    return unsubscribe
  }, [user])

  // Filter transactions
  useEffect(() => {
    let filtered = transactions

    // Date filter
    filtered = filtered.filter((tx) => tx.date >= dateRange.start && tx.date <= dateRange.end)

    // Category filter
    if (filter !== 'all') {
      filtered = filtered.filter((tx) => (tx.budgetCategory || autoTagTransaction(tx.merchant)) === filter)
    }

    // Sort by date desc
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date))
    setFilteredTransactions(filtered)
  }, [transactions, filter, dateRange])

  // Handle Plaid link
  const handlePlaidSuccess = async (publicToken) => {
    try {
      setLoading(true)
      
      // Exchange public token for secure token
      const { secureToken } = await exchangePublicToken(publicToken, '')
      
      // Store secure token in session
      sessionStorage.setItem('plaid_secure_token', secureToken)
      
      // Fetch transactions using the secure token
      await fetchTransactions(secureToken)
      
      alert('Bank connected successfully!')
    } catch (error) {
      console.error('Plaid setup error:', error)
      alert('Failed to connect bank')
    } finally {
      setLoading(false)
    }
  }

  // Handle category update
  const handleTagTransaction = async (newCategory) => {
    if (!selectedTransaction) return

    try {
      const txRef = doc(db, 'transactions', selectedTransaction.id)
      await updateDoc(txRef, { budgetCategory: newCategory })
      setSelectedTransaction(null)
    } catch (error) {
      console.error('Tag error:', error)
      alert('Failed to update category')
    }
  }

  // Calculate stats
  const stats = {
    total: filteredTransactions.reduce((s, tx) => s + tx.amount, 0),
    byCategory: categories.reduce((acc, cat) => ({
      ...acc,
      [cat]: filteredTransactions
        .filter((tx) => (tx.budgetCategory || autoTagTransaction(tx.merchant)) === cat)
        .reduce((s, tx) => s + tx.amount, 0),
    }), {}),
  }

  const currentMonth = dateRange.start.substring(0, 7)
  const currentBudget = budgets[currentMonth] || {}

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-2xl text-on-surface">Transactions</h1>
            <p className="text-gray-400 text-sm">Track spending and smart categorization</p>
          </div>
        </div>
      </div>

      {/* Linked Accounts */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-surface border border-outline-variant rounded-2xl p-4 md:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline font-bold text-on-surface">Connected Accounts</h2>
              <PlaidLinkButton onSuccess={handlePlaidSuccess} />
            </div>

            {linkedAccounts.length === 0 ? (
              <div className="text-center py-8">
                <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '48px' }}>account_balance</span>
                <p className="text-gray-400 mt-2">No accounts connected</p>
                <p className="text-xs text-gray-600">Connect your bank to see transactions</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {linkedAccounts.map((account) => (
                  <div key={account.id} className="bg-surface-container rounded-lg p-3 border border-outline-variant/50">
                    <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">{account.name}</p>
                    <p className="text-on-surface font-headline font-bold text-lg">{fmt(account.balance)}</p>
                    <p className="text-gray-500 text-xs mt-1">{account.type}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date Range */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">From</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">To</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Category</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded px-3 py-2 text-sm text-on-surface outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            className="bg-surface border border-outline-variant rounded-2xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Total Spending</p>
            <p className={`font-headline font-bold text-2xl ${stats.total > (currentBudget.totalExpenses || 0) ? 'text-error' : 'text-on-surface'}`}>
              {fmt(stats.total)}
            </p>
            {currentBudget.totalExpenses && (
              <p className="text-xs text-gray-500 mt-2">
                Budget: {fmt(currentBudget.totalExpenses)} 
                <span className={stats.total > currentBudget.totalExpenses ? ' text-error' : ' text-gray-500'}>
                  {stats.total > currentBudget.totalExpenses ? ` (Over $${(stats.total - currentBudget.totalExpenses).toFixed(2)})` : ' (On track)'}
                </span>
              </p>
            )}
          </motion.div>

          <motion.div
            className="bg-surface border border-outline-variant rounded-2xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Transactions</p>
            <p className="font-headline font-bold text-2xl text-on-surface">{filteredTransactions.length}</p>
            <p className="text-xs text-gray-500 mt-2">
              Average: {filteredTransactions.length > 0 ? fmt(stats.total / filteredTransactions.length) : '$0.00'}
            </p>
          </motion.div>

          <motion.div
            className="bg-surface border border-outline-variant rounded-2xl p-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-gray-400 text-xs uppercase tracking-widest font-bold mb-1">Biggest Category</p>
            {Object.entries(stats.byCategory).length > 0 ? (
              <>
                <p className="font-headline font-bold text-on-surface">
                  {Object.entries(stats.byCategory).reduce((a, b) => (b[1] > a[1] ? b : a), ['', 0])[0]}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {fmt(Math.max(...Object.values(stats.byCategory)))}
                </p>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No data</p>
            )}
          </motion.div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 mb-6">
          <h3 className="font-headline font-bold text-on-surface mb-4">Spending by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <div key={cat} className="bg-surface-container rounded-lg p-3">
                <p className="text-gray-400 text-xs font-bold mb-1">{cat}</p>
                <p className="text-on-surface font-bold">{fmt(stats.byCategory[cat] || 0)}</p>
                {currentBudget.categories?.[cat] && (
                  <p className="text-xs text-gray-500 mt-1">
                    Budget: {fmt(Math.abs(currentBudget.categories[cat]))}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
          <div className="bg-surface-container px-4 py-3">
            <h3 className="font-headline font-bold text-on-surface">Recent Transactions</h3>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '48px' }}>receipt</span>
              <p className="text-gray-400 mt-2">No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-outline-variant/30 bg-surface-container/30 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Merchant</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx) => (
                    <motion.tr
                      key={tx.id}
                      className="border-t border-outline-variant/30 hover:bg-surface-container/50 transition-colors group"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <td className="px-4 py-3 text-sm text-gray-400">{tx.date}</td>
                      <td className="px-4 py-3 text-sm text-on-surface">{tx.merchant}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-bold">
                          {tx.budgetCategory || autoTagTransaction(tx.merchant)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-on-surface text-right font-semibold">{fmt(tx.amount)}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedTransaction(tx)}
                          className="text-primary hover:text-primary/75 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tagging Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <TaggingModal
            transaction={selectedTransaction}
            onSave={handleTagTransaction}
            onClose={() => setSelectedTransaction(null)}
            categories={categories}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
