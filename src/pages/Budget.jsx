import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

function fmt(n) {
  return `${n < 0 ? '-' : ''}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

const CATEGORY_MAP = {
  'Income':           { emoji: '💰', color: 'border-t-emerald-500', barColor: 'bg-emerald-500', isExpense: false },
  'Housing':          { emoji: '🏠', color: 'border-t-red-500',     barColor: 'bg-red-500', isExpense: true },
  'Bills & Utilities':{ emoji: '⚡', color: 'border-t-yellow-500',  barColor: 'bg-yellow-500', isExpense: true },
  'Food & Dining':    { emoji: '🍕', color: 'border-t-orange-500',  barColor: 'bg-orange-500', isExpense: true },
  'Transportation':   { emoji: '🚗', color: 'border-t-blue-500',    barColor: 'bg-blue-500', isExpense: true },
  'Insurance':        { emoji: '🛡️', color: 'border-t-sky-500',     barColor: 'bg-sky-500', isExpense: true },
  'Subscriptions':    { emoji: '📺', color: 'border-t-purple-500',  barColor: 'bg-purple-500', isExpense: true },
  'Shopping':         { emoji: '🛒', color: 'border-t-pink-500',    barColor: 'bg-pink-500', isExpense: true },
  'Entertainment':    { emoji: '🎮', color: 'border-t-violet-500',  barColor: 'bg-violet-500', isExpense: true },
  'Healthcare':       { emoji: '🏥', color: 'border-t-red-500',     barColor: 'bg-red-500', isExpense: true },
  'Savings':          { emoji: '🏦', color: 'border-t-emerald-500', barColor: 'bg-emerald-500', isExpense: false },
  'Investing':        { emoji: '📈', color: 'border-t-primary',     barColor: 'bg-primary', isExpense: false },
  'Other':            { emoji: '📋', color: 'border-t-gray-500',    barColor: 'bg-gray-500', isExpense: true },
}

function EditableCell({ value, onSave, isExpense, emptyPlaceholder }) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(value === null || value === undefined ? '' : Math.abs(value))

  if (editing) {
    return (
      <div className="relative inline-block w-24">
        {isExpense && temp !== '' && <span className="absolute left-1 top-0.5 text-xs text-gray-400 font-body">-</span>}
        <input
           autoFocus
           type="number"
           value={temp}
           onChange={(e) => setTemp(e.target.value)}
           onBlur={() => { setEditing(false); onSave(temp) }}
           onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onSave(temp) } }}
           className={`w-full bg-surface border border-primary/50 rounded px-1 text-right outline-none font-body text-xs text-on-surface ${isExpense ? 'pl-3' : ''}`}
        />
      </div>
    )
  }

  const handleEdit = (e) => {
    e.stopPropagation()
    setTemp(value === null || value === undefined ? '' : Math.abs(value))
    setEditing(true)
  }

  if (value === null || value === undefined || value === '') {
    return <div onClick={handleEdit} className="cursor-text text-right px-1 rounded hover:bg-surface-container-high transition-colors font-body text-xs text-gray-500">{emptyPlaceholder || '0.00'}</div>
  }

  return (
    <div onClick={handleEdit} className="cursor-text text-right px-1 rounded hover:bg-surface-container-high transition-colors font-body text-xs font-semibold text-on-surface">
      {fmt(isExpense ? -Math.abs(value) : value)}
    </div>
  )
}

function CategoryCard({ category, planned, actual, override, onUpdate, recurring }) {
  const meta = CATEGORY_MAP[category] || CATEGORY_MAP['Other']
  const isExpense = meta.isExpense
  
  const [expanded, setExpanded] = useState(false)
  const [isRecurring, setIsRecurring] = useState(!!recurring)

  const pctUsed = planned > 0 ? Math.min(100, Math.round((actual / planned) * 100)) : 0
  const remaining = planned - actual

  const handleToggleRecurring = (e) => {
    e.stopPropagation()
    setIsRecurring((prev) => {
      const newVal = !prev
      onUpdate(category, 'recurring', newVal)
      return newVal
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`h-1.5 w-full ${meta.barColor}`} />
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-4 pb-3 display-block">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-lg shadow-inner">
             {meta.emoji}
          </div>
          <div className="flex-1">
             <h4 className="font-headline font-bold text-on-surface text-[13px]">{category}</h4>
             <p className="text-[10px] text-gray-500 font-body">Linked: {category}</p>
             <p className="text-[10px] text-gray-400 font-body mt-0.5">Budget: {fmt(planned)}</p>
          </div>
          {/* Recurring Toggle */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-gray-500 font-body">Recurring</span>
            <button
              onClick={handleToggleRecurring}
              className={`w-8 h-4 rounded-full border transition-colors duration-200 flex items-center ${isRecurring ? 'bg-amber-400 border-amber-500' : 'bg-gray-300 border-gray-400'}`}
              aria-label="Toggle recurring"
            >
              <span className={`block w-3 h-3 rounded-full bg-white shadow transform transition-transform duration-200 ${isRecurring ? 'translate-x-4' : 'translate-x-0'}`}></span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] font-body text-gray-500">Spent: <span className={`font-bold ${isExpense ? 'text-on-surface' : 'text-success'}`}>{fmt(actual)}</span></span>
          <span className={`text-[11px] font-body font-bold ${remaining >= 0 ? 'text-success' : 'text-error'}`}>
            {fmt(Math.abs(remaining))} {remaining >= 0 ? 'left' : 'over'}
          </span>
        </div>
        <div className="h-1.5 bg-surface-container rounded-full overflow-hidden mb-1">
          <div className={`h-full rounded-full transition-all ${meta.barColor}`} style={{ width: `${pctUsed}%` }} />
        </div>
        <p className="text-right text-[9px] text-gray-400 font-body">{pctUsed}% used</p>
      </button>

      {/* Expanded detail view */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-outline-variant/30"
          >
            <div className="p-4 bg-surface-container/30">
              <div className="flex items-center justify-between py-1.5 border-b border-outline-variant/20 mb-2">
                 <p className="text-[10px] font-body text-gray-400">Planned Budget</p>
                 <EditableCell value={planned} onSave={(v) => onUpdate(category, 'planned', v)} isExpense={false} />
              </div>
              <div className="flex items-center justify-between py-1.5">
                 <div>
                    <p className="text-[10px] font-body text-gray-400">Manual Actual Override</p>
                    <p className="text-[8px] text-gray-500 mt-0.5">Overrides auto-synced bank transactions</p>
                 </div>
                 <EditableCell value={override} onSave={(v) => onUpdate(category, 'actual', v)} emptyPlaceholder="Auto-sync" isExpense={isExpense} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Budget() {
  const {
    budget, currentMonth, switchMonth, updateBudgetItem,
    getActual, getPlanned, EXPENSE_CATEGORIES,
    totalPlannedIncome, totalPlannedExpenses,
    totalIncome, totalExpenses,
    unassigned, unassignedPlanned
  } = useApp()

  const months = useMemo(() => {
    const res = []
    const now = new Date()
    for (let i = -6; i <= 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
      res.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
    }
    return res
  }, [])

  const monthDisplay = useMemo(() => {
    const [year, month] = currentMonth.split('-')
    return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }, [currentMonth])

  // Total allocated towards expenses
  const totalBudgeted = totalPlannedExpenses
  const totalSpent = totalExpenses
  const totalRemaining = totalBudgeted - totalSpent

  const CATEGORIES = ['Income', 'Savings', 'Investing', ...EXPENSE_CATEGORIES]

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-on-surface text-2xl">Budget</h1>
            <p className="text-gray-500 text-xs font-body mt-0.5">{monthDisplay}</p>
          </div>
          <select
            value={currentMonth}
            onChange={(e) => switchMonth(e.target.value)}
            className="bg-surface-container border border-outline-variant rounded-xl px-3 py-1.5 text-xs font-body text-on-surface outline-none focus:border-primary"
          >
            {months.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* MONTHLY BUDGET SUMMARY (3 cards) */}
        <div>
          <h2 className="font-headline font-bold text-on-surface text-lg mb-3">Monthly Budget Summary</h2>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold mb-2">Total Budgeted</p>
              <h3 className="font-headline font-bold text-on-surface text-[17px]">{fmt(totalBudgeted)}</h3>
            </div>
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold mb-2">Total Spent</p>
              <h3 className="font-headline font-bold text-error text-[17px]">{fmt(totalSpent)}</h3>
            </div>
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold mb-2">Remaining</p>
              <h3 className={`font-headline font-bold text-[17px] ${totalRemaining >= 0 ? 'text-success' : 'text-error'}`}>{fmt(Math.abs(totalRemaining))}</h3>
            </div>
          </div>
        </div>

        {/* ZERO-BASED STATUS (Overall Household) */}
        <div className={`border-2 rounded-2xl p-3 shadow-sm transition-colors ${
          unassigned === 0 ? 'border-success/40 bg-success/5' : unassigned > 0 ? 'border-primary/40 bg-primary/5' : 'border-error/40 bg-error/5'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-body font-bold text-on-surface">
              {unassigned === 0 ? '✅ Fully Allocated' : unassigned > 0 ? `${fmt(unassigned)} Unassigned` : `${fmt(Math.abs(unassigned))} Over Budget`}
            </p>
            <p className="text-[9px] font-body text-gray-500">Left to Plan: {fmt(unassignedPlanned)}</p>
          </div>
        </div>

        {/* CATEGORIES GRID matching reference */}
        <div>
          <h2 className="font-headline font-bold text-on-surface text-lg mb-3 mt-6">Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map(category => (
              <CategoryCard
                key={category}
                category={category}
                planned={getPlanned(category)}
                actual={getActual(category)}
                override={budget[category]?.actual}
                recurring={budget[category]?.recurring}
                onUpdate={updateBudgetItem}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
