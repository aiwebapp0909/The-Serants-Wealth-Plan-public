import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { usePlaid } from '../hooks/usePlaid'

function fmt(n) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function Transactions() {
  const { transactions, addTransaction, removeTransaction, budget } = useApp()
  const { open, ready } = usePlaid()
  const [isAdding, setIsAdding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('All')

  // Combine all budget categories for the dropdown
  const allCategories = useMemo(() => {
    const cats = ['Income', 'Fixed Bills', 'Food', 'Savings', 'Investing', 'Fun Money']
    return cats
  }, [])

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.category.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory
      return matchesSearch && matchesCategory
    })
  }, [transactions, searchTerm, filterCategory])

  const [newTx, setNewTx] = useState({
    description: '',
    amount: '',
    category: 'Food',
    date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!newTx.description || !newTx.amount) return
    addTransaction({
      ...newTx,
      amount: Number(newTx.amount)
    })
    setNewTx({
      description: '',
      amount: '',
      category: 'Food',
      date: new Date().toISOString().split('T')[0]
    })
    setIsAdding(false)
  }

  return (
    <div className="bg-background min-h-screen px-4 pt-5 pb-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-2xl">Transactions</h1>
          <p className="text-gray-500 text-xs font-body mt-1">Track every dollar you spend or earn</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => open()}
            disabled={!ready}
            className="flex items-center gap-2 px-4 rounded-full bg-surface-container border border-outline-variant text-[10px] font-body font-bold text-on-surface hover:border-primary/50 transition-all disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">account_balance</span>
            CONNECT BANK
          </button>
          <button
            onClick={() => setIsAdding(true)}
            className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-transform"
          >
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 no-scrollbar">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">search</span>
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-outline-variant rounded-xl py-2 pl-9 pr-4 text-xs font-body text-on-surface outline-none focus:border-primary transition-colors"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-surface border border-outline-variant rounded-xl py-2 px-3 text-xs font-body text-on-surface outline-none focus:border-primary transition-colors"
        >
          <option value="All">All Categories</option>
          {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-gray-600 text-4xl mb-2">receipt_long</span>
            <p className="text-gray-500 text-sm font-body">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {filteredTransactions.map((t, idx) => (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                key={t.id}
                className="p-4 flex items-center gap-4 hover:bg-surface-container transition-colors group"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  t.category === 'Income' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'
                }`}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {t.category === 'Income' ? 'payments' : 'shopping_bag'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-bold text-on-surface truncate">{t.description}</p>
                  <p className="text-[10px] font-body text-gray-500 uppercase tracking-wider">{t.category} • {t.date}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-headline font-bold ${
                    t.category === 'Income' ? 'text-success' : 'text-error'
                  }`}>
                    {t.category === 'Income' ? '+' : '-'}{fmt(t.amount)}
                  </p>
                  <button
                    onClick={() => removeTransaction(t.id)}
                    className="text-[10px] font-body text-gray-600 opacity-0 group-hover:opacity-100 hover:text-error transition-all"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="relative w-full max-w-md bg-surface border border-outline-variant rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-headline font-bold text-on-surface text-xl">Add Transaction</h2>
                <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-on-surface">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-body text-gray-400 uppercase tracking-widest block mb-1">Description</label>
                  <input
                    autoFocus
                    type="text"
                    placeholder="E.g. Grocery Shopping"
                    value={newTx.description}
                    onChange={e => setNewTx({ ...newTx, description: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm font-body text-on-surface focus:border-primary outline-none transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-body text-gray-400 uppercase tracking-widest block mb-1">Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={newTx.amount}
                        onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                        className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 pl-8 pr-4 text-sm font-body text-on-surface focus:border-primary outline-none transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-body text-gray-400 uppercase tracking-widest block mb-1">Date</label>
                    <input
                      type="date"
                      value={newTx.date}
                      onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                      className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm font-body text-on-surface focus:border-primary outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-body text-gray-400 uppercase tracking-widest block mb-1">Category</label>
                  <select
                    value={newTx.category}
                    onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm font-body text-on-surface focus:border-primary outline-none transition-colors"
                  >
                    {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary text-background font-headline font-bold py-4 rounded-2xl mt-4 hover:bg-primary/90 transition-colors"
                >
                  Save Transaction
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
