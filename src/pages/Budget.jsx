import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

const ICON_MAP = {
  person: 'person',
  storefront: 'storefront',
  home: 'home',
  directions_car: 'directions_car',
  smartphone: 'smartphone',
  wifi: 'wifi',
  bolt: 'bolt',
  shopping_cart: 'shopping_cart',
  restaurant: 'restaurant',
  savings: 'savings',
  trending_up: 'trending_up',
  sports_esports: 'sports_esports',
  spa: 'spa',
  payments: 'payments',
  receipt: 'receipt',
  lunch_dining: 'lunch_dining',
  bar_chart: 'bar_chart',
  celebration: 'celebration',
  circle: 'circle',
}

function EditableCell({ value, onChange, isExpense = false, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const handleFocus = () => {
    setDraft(value === 0 ? '' : String(value))
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  const handleBlur = () => {
    setEditing(false)
    const parsed = parseFloat(draft.replace(/[^0-9.]/g, ''))
    onChange(isNaN(parsed) ? 0 : parsed)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') inputRef.current?.blur()
    if (e.key === 'Escape') { setDraft(String(value)); inputRef.current?.blur() }
  }

  return (
    <div
      className={`relative flex items-center justify-end gap-0.5 cursor-pointer ${className}`}
      onClick={() => !editing && inputRef.current?.focus()}
    >
      <span className={`text-xs font-body ${isExpense ? 'text-error' : 'text-gray-400'}`}>
        {isExpense ? '-$' : '$'}
      </span>
      <input
        ref={inputRef}
        type="number"
        value={editing ? draft : value || 0}
        onChange={e => setDraft(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="bg-transparent text-on-surface text-xs font-body w-16 text-right outline-none focus:text-primary transition-colors"
        min="0"
        step="1"
      />
    </div>
  )
}

function BudgetSection({ title, sectionKey, items, isExpense = false, color = 'text-on-surface' }) {
  const [collapsed, setCollapsed] = useState(false)
  const { updateBudgetItem, updateBudgetItemName, addBudgetItem, removeBudgetItem } = useApp()

  const totalPlanned = items.reduce((s, i) => s + Number(i.planned || 0), 0)
  const totalActual = items.reduce((s, i) => s + Number(i.actual || 0), 0)

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden">
      {/* Section Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-container transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className={`material-symbols-outlined ${collapsed ? '' : 'rotate-0'} text-gray-400 text-base transition-transform ${collapsed ? '-rotate-90' : ''}`}>
            expand_more
          </span>
          <span className={`text-xs font-body font-bold uppercase tracking-widest ${color}`}>
            {title}
          </span>
          <span className={`text-xs font-body font-bold ${isExpense ? 'text-error' : 'text-success'}`}>
            {isExpense ? `-$${totalPlanned.toLocaleString()}` : `+$${totalPlanned.toLocaleString()}`}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {items.map((item, idx) => {
              const remaining = isExpense
                ? item.planned - item.actual
                : item.actual - item.planned
              return (
                <div
                  key={item.id}
                  className={`flex items-center px-4 py-3 gap-3 ${idx < items.length - 1 ? 'border-b border-outline-variant/40' : ''} group hover:bg-surface-container/40 transition-colors`}
                >
                  {/* Icon */}
                  <div className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '13px' }}>
                      {ICON_MAP[item.icon] || 'circle'}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={item.name}
                      onChange={e => updateBudgetItemName(sectionKey, item.id, e.target.value)}
                      className="bg-transparent text-on-surface text-xs font-body w-full outline-none focus:text-primary transition-colors truncate"
                    />
                  </div>

                  {/* Planned */}
                  <EditableCell
                    value={item.planned}
                    onChange={v => updateBudgetItem(sectionKey, item.id, 'planned', v)}
                    isExpense={isExpense}
                    className="w-20"
                  />

                  {/* Actual */}
                  <EditableCell
                    value={item.actual}
                    onChange={v => updateBudgetItem(sectionKey, item.id, 'actual', v)}
                    isExpense={isExpense}
                    className="w-20"
                  />

                  {/* Remaining */}
                  <div className="w-12 text-right">
                    <span className={`text-xs font-body ${
                      remaining > 0 ? 'text-success' : remaining < 0 ? 'text-error' : 'text-gray-600'
                    }`}>
                      {remaining < 0 ? '-' : ''}${Math.abs(remaining).toLocaleString()}
                    </span>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => removeBudgetItem(sectionKey, item.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-error transition-all ml-1"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>close</span>
                  </button>
                </div>
              )
            })}

            {/* Add Row */}
            <button
              onClick={() => addBudgetItem(sectionKey)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-gray-600 hover:text-gray-400 text-xs font-body border-t border-dashed border-outline-variant/50 transition-colors"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
              ADD CUSTOM CATEGORY
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Budget() {
  const { budget, totalIncome, totalExpenses, totalPlannedIncome, totalPlannedExpenses } = useApp()
  const totalRemaining = totalPlannedIncome - totalPlannedExpenses

  return (
    <div className="bg-background min-h-screen px-4 pt-5 pb-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="font-headline font-bold text-on-surface text-2xl">Monthly Configurator</h1>
        <p className="text-gray-500 text-xs font-body mt-1">
          Plan every dollar. Adjust categories, inputs, and amounts directly inline.
        </p>
      </div>

      {/* Summary Bar */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 mb-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-success font-headline font-bold text-base">
              ${totalPlannedIncome.toLocaleString()}
            </p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider">Planned Income</p>
          </div>
          <div>
            <p className="text-error font-headline font-bold text-base">
              -${totalPlannedExpenses.toLocaleString()}
            </p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider">Planned Out</p>
          </div>
          <div>
            <p className={`font-headline font-bold text-base ${totalRemaining >= 0 ? 'text-primary' : 'text-error'}`}>
              {totalRemaining >= 0 ? '+' : '-'}${Math.abs(totalRemaining).toLocaleString()}
            </p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider">Remaining</p>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(100, totalPlannedIncome > 0 ? (totalPlannedExpenses / totalPlannedIncome) * 100 : 0)}%` }}
          />
        </div>
        <p className="text-gray-600 text-[9px] font-body mt-1.5 text-center">
          {totalPlannedIncome > 0
            ? `${Math.round((totalPlannedExpenses / totalPlannedIncome) * 100)}% of income allocated`
            : 'Enter your income to track allocation'}
        </p>
      </div>

      {/* Column Headers */}
      <div className="flex items-center px-4 py-1 mb-1">
        <span className="flex-1 text-[9px] font-body font-semibold text-gray-600 uppercase tracking-wider">Category</span>
        <span className="w-20 text-right text-[9px] font-body font-semibold text-gray-600 uppercase tracking-wider">Planned ($)</span>
        <span className="w-20 text-right text-[9px] font-body font-semibold text-gray-600 uppercase tracking-wider">Actual ($)</span>
        <span className="w-12 text-right text-[9px] font-body font-semibold text-gray-600 uppercase tracking-wider">Left</span>
        <span className="w-6" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        <BudgetSection
          title="Income"
          sectionKey="income"
          items={budget.income}
          isExpense={false}
          color="text-success"
        />
        <BudgetSection
          title="Fixed Bills"
          sectionKey="fixedBills"
          items={budget.fixedBills}
          isExpense
          color="text-error"
        />
        <BudgetSection
          title="Food & Dining"
          sectionKey="food"
          items={budget.food}
          isExpense
          color="text-error"
        />
        <BudgetSection
          title="Fun Money"
          sectionKey="funMoney"
          items={budget.funMoney}
          isExpense
          color="text-error"
        />
        <BudgetSection
          title="Savings"
          sectionKey="savings"
          items={budget.savings}
          isExpense
          color="text-error"
        />
        <BudgetSection
          title="Investing"
          sectionKey="investing"
          items={budget.investing}
          isExpense
          color="text-error"
        />
      </div>
    </div>
  )
}
