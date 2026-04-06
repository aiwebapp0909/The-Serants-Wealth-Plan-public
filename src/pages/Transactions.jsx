import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db, auth } from '../firebase'
import { collection, addDoc, deleteDoc, doc, query, where, onSnapshot, updateDoc } from 'firebase/firestore'
import { useApp } from '../context/AppContext'
import { usePlaid } from '../hooks/usePlaid'

// Category definitions with colors and icons
const CATEGORY_MAP = {
  'Income':           { color: 'bg-success/10 text-success border-success/20', icon: '💰' },
  'Housing':          { color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: '🏠' },
  'Bills & Utilities':{ color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', icon: '⚡' },
  'Food & Dining':    { color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: '🍕' },
  'Transportation':   { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: '🚗' },
  'Insurance':        { color: 'bg-sky-500/10 text-sky-500 border-sky-500/20', icon: '🛡️' },
  'Subscriptions':    { color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: '📺' },
  'Shopping':         { color: 'bg-pink-500/10 text-pink-500 border-pink-500/20', icon: '🛒' },
  'Entertainment':    { color: 'bg-violet-500/10 text-violet-500 border-violet-500/20', icon: '🎮' },
  'Healthcare':       { color: 'bg-red-500/10 text-red-500 border-red-500/20', icon: '🏥' },
  'Savings':          { color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: '🏦' },
  'Investing':        { color: 'bg-primary/10 text-primary border-primary/20', icon: '📈' },
  'Other':            { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', icon: '📋' },
}

const CATEGORIES = Object.keys(CATEGORY_MAP)

function fmt(n) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function getCategoryStyle(category) {
  return CATEGORY_MAP[category] || CATEGORY_MAP['Other']
}

function AddTransactionModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Other')
  const [type, setType] = useState('expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = () => {
    if (!name.trim() || !amount) return
    onAdd({
      name: name.trim(),
      merchant: name.trim(),
      amount: Number(amount),
      category,
      isExpense: type === 'expense',
      date,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl">
        <h2 className="font-headline font-bold text-on-surface text-xl mb-5">+ Add Transaction</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Salary"
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Amount ($) *</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5200"
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary">
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 bg-surface-container border border-outline-variant rounded-xl py-3.5 text-xs font-bold font-headline">CANCEL</button>
          <button onClick={handleSubmit} disabled={!name.trim() || !amount}
            className="flex-1 bg-primary text-background rounded-xl py-3.5 text-xs font-bold font-headline disabled:opacity-40">
            ADD
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Transactions() {
  const { addTransaction, transactions } = useApp()
  const { open, ready } = usePlaid()
  const [loading, setLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all') // all, income, expense
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions]

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(tx =>
        (tx.merchant || tx.name || '').toLowerCase().includes(q) ||
        (tx.category || '').toLowerCase().includes(q)
      )
    }

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'income') {
        filtered = filtered.filter(tx => tx.isExpense === false)
      } else {
        filtered = filtered.filter(tx => tx.isExpense !== false)
      }
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(tx => tx.category === categoryFilter)
    }

    // Date filter
    if (dateRange.start) {
      filtered = filtered.filter(tx => tx.date >= dateRange.start)
    }
    if (dateRange.end) {
      filtered = filtered.filter(tx => tx.date <= dateRange.end)
    }

    return filtered
  }, [transactions, searchQuery, typeFilter, categoryFilter, dateRange])

  const handleAddTransaction = async (tx) => {
    const user = auth.currentUser
    if (!user) return
    try {
      await addDoc(collection(db, 'transactions'), {
        ...tx,
        userId: user.uid,
        createdAt: new Date().toISOString(),
      })
      addTransaction(tx)
    } catch (e) {
      console.error('Error adding transaction:', e)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id))
    } catch (e) {
      console.error('Error deleting transaction:', e)
    }
  }

  const usedCategories = useMemo(() => {
    return [...new Set(transactions.map(t => t.category).filter(Boolean))]
  }, [transactions])

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-on-surface text-2xl">Transactions</h1>
            <p className="text-gray-500 text-xs font-body mt-0.5">Track and manage all your income and expenses.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (ready) {
                  setIsSyncing(true)
                  open()
                  // Reset syncing after 10s back to false broadly to avoid infinite load if user closes modal without success
                  setTimeout(() => setIsSyncing(false), 15000)
                }
              }}
              disabled={!ready || isSyncing}
              className="flex items-center gap-1.5 bg-surface border border-outline-variant text-on-surface px-4 py-2.5 rounded-xl font-body font-bold text-sm hover:bg-surface-container transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-lg">account_balance</span>
              {isSyncing ? 'Linking...' : 'Connect Bank'}
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 bg-primary text-background px-4 py-2.5 rounded-xl font-body font-bold text-sm hover:bg-primary/90 transition-colors active:scale-[0.97]"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              Add Transaction
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* FILTER BAR */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" style={{ fontSize: '16px' }}>search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="w-full bg-surface-container border border-outline-variant rounded-xl pl-9 pr-3 py-2 text-sm text-on-surface outline-none focus:border-primary transition-colors placeholder-gray-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
            >
              <option value="all">All Categories</option>
              {usedCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Date Range */}
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              placeholder="From"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
              placeholder="To"
            />
          </div>
        </div>

        {/* TRANSACTIONS TABLE */}
        <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-500 text-xs">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-[10px] font-body text-gray-500 uppercase tracking-wider border-b border-outline-variant">
                    <th className="text-left px-4 py-3 font-semibold">Name</th>
                    <th className="text-left px-4 py-3 font-semibold">Category</th>
                    <th className="text-left px-4 py-3 font-semibold">Date</th>
                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                    <th className="text-right px-4 py-3 font-semibold">Amount</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((tx, idx) => {
                    const catStyle = getCategoryStyle(tx.category)
                    const isIncome = tx.isExpense === false

                    return (
                      <motion.tr
                        key={tx.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="border-b border-outline-variant/20 hover:bg-surface-container/30 transition-colors group"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${catStyle.color}`}>
                              {catStyle.icon}
                            </div>
                            <div>
                              <p className="text-sm font-body text-on-surface font-medium">{tx.merchant || tx.name}</p>
                              <p className="text-[10px] text-gray-500">{tx.category || 'Uncategorized'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${catStyle.color}`}>
                            <span className="text-[10px]">{catStyle.icon}</span>
                            {tx.category || 'Other'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-gray-400 font-body">
                          {new Date(tx.date).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                            isIncome ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'
                          }`}>
                            {isIncome ? 'income' : 'expense'}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 text-sm text-right font-body font-bold ${isIncome ? 'text-success' : 'text-error'}`}>
                          {isIncome ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                        <td className="px-2 py-3.5">
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="text-gray-600 hover:text-error opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-gray-600 text-4xl mb-3">receipt_long</span>
              <p className="text-gray-400 text-sm font-body mb-1">No transactions found</p>
              <p className="text-gray-500 text-xs">
                {transactions.length === 0 ? 'Add your first transaction to get started' : 'Try adjusting your filters'}
              </p>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredTransactions.length > 0 && (
          <div className="mt-3 text-center">
            <p className="text-[10px] text-gray-500 font-body">
              Showing {filteredTransactions.length} of {transactions.length} transactions
            </p>
          </div>
        )}
      </div>

      {/* Add Transaction Modal */}
      <AnimatePresence>
        {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} onAdd={handleAddTransaction} />}
      </AnimatePresence>
    </div>
  )
}
