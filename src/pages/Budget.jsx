import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

function fmt(n) {
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
}

function EditableCell({ value, onSave, isExpense = false }) {
  const [editing, setEditing] = useState(false)
  const [temp, setTemp] = useState(Math.abs(value))

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={temp}
        onChange={(e) => setTemp(e.target.value)}
        onBlur={() => { setEditing(false); onSave(temp) }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onSave(temp) } }}
        className="w-full bg-surface-container border border-primary/50 rounded px-2 py-0.5 text-right outline-none font-body text-xs text-on-surface"
      />
    )
  }

  return (
    <div 
      onClick={() => setEditing(true)}
      className={`cursor-text text-right px-2 py-0.5 rounded hover:bg-surface-container-high transition-colors font-body text-xs font-semibold ${isExpense ? 'text-error' : 'text-success'}`}
    >
      {isExpense && '-'} {fmt(value)}
    </div>
  )
}

function BudgetSection({ title, items, section, onUpdate, onAdd, onRemove, isExpense = false }) {
  const totalActual = items.reduce((s, i) => s + Math.abs(i.actual || 0), 0)
  const totalPlanned = items.reduce((s, i) => s + Math.abs(i.planned || 0), 0)

  return (
    <div className="bg-surface border border-outline-variant rounded-2xl overflow-hidden mb-4 shadow-sm">
      <div className="bg-surface-container px-4 py-3 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
           <h3 className="font-headline font-bold text-on-surface text-sm uppercase tracking-tight">{title}</h3>
           <div className="flex items-center gap-3">
             <span className="text-[9px] font-body text-gray-500 uppercase tracking-widest font-bold">
               Planned: {fmt(totalPlanned)}
             </span>
             <span className={`text-[9px] font-body uppercase tracking-widest font-bold ${totalActual > totalPlanned && isExpense ? 'text-error' : totalActual >= totalPlanned && !isExpense ? 'text-success' : 'text-gray-400'}`}>
               Actual: {fmt(totalActual)}
             </span>
           </div>
        </div>
        <button onClick={() => onAdd(section)} className="text-primary hover:scale-110 transition-transform">
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
        </button>
      </div>
      
      <div className="p-2">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-[10px] font-body text-gray-500 uppercase tracking-wider">
              <th className="text-left px-2 py-1 font-semibold">Category</th>
              <th className="text-right px-2 py-1 font-semibold w-24">Planned</th>
              <th className="text-right px-2 py-1 font-semibold w-24">Actual</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t border-outline-variant/30 group">
                <td className="px-2 py-2">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-400" style={{ fontSize: '16px' }}>{item.icon}</span>
                    <input
                      value={item.name}
                      onChange={(e) => onUpdate(section, item.id, 'name', e.target.value)}
                      className="bg-transparent border-none outline-none font-body text-xs text-on-surface w-full focus:bg-surface-container-high rounded px-1"
                    />
                  </div>
                </td>
                <td className="px-2 py-2">
                  <EditableCell 
                    value={item.planned} 
                    onSave={(v) => onUpdate(section, item.id, 'planned', v)} 
                    isExpense={isExpense}
                  />
                </td>
                <td className="px-2 py-2">
                  <EditableCell 
                    value={item.actual} 
                    onSave={(v) => onUpdate(section, item.id, 'actual', v)} 
                    isExpense={isExpense}
                  />
                </td>
                <td className="px-1 text-center">
                  <button onClick={() => onRemove(section, item.id)} className="text-gray-400 hover:text-error opacity-0 group-hover:opacity-100 transition-all text-[14px]">
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Budget() {
  const { 
    budget, updateBudgetItem, updateBudgetItemName, addBudgetItem, removeBudgetItem,
    totalIncome, totalExpenses, totalSavings, totalInvesting,
    unassigned, unassignedPlanned, currentMonth, switchMonth
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

  return (
    <div className="bg-background min-h-screen px-4 pt-6 pb-24">
      {/* Header & Month Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-2xl">{monthDisplay} Budget</h1>
          <p className="text-gray-500 text-[10px] font-body uppercase tracking-[0.2em] mt-1">Direct Zero-Based Control</p>
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

      {/* ZERO-BASED STATUS BAR */}
      <motion.div 
        layout
        className={`bg-surface border-2 rounded-2xl p-4 mb-6 transition-colors shadow-lg ${
          unassigned === 0 ? 'border-success/50' : unassigned > 0 ? 'border-primary/50' : 'border-error/50'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1">Budget Assignment Status</p>
            <h2 className={`font-headline font-bold text-2xl ${
              unassigned === 0 ? 'text-success' : unassigned > 0 ? 'text-primary' : 'text-error'
            }`}>
              {unassigned === 0 ? 'Fully Allocated ✅' : unassigned > 0 ? `${fmt(unassigned)} Unassigned` : `${fmt(Math.abs(unassigned))} Over Budget`}
            </h2>
          </div>
          <div className="text-right">
             <p className="text-[9px] font-body text-gray-400 uppercase tracking-widest">Left to Plan</p>
             <p className={`font-headline font-bold text-base ${unassignedPlanned === 0 ? 'text-success' : 'text-gray-500'}`}>
               {fmt(unassignedPlanned)}
             </p>
          </div>
        </div>
      </motion.div>

      {/* Sections */}
      <BudgetSection 
        title="💰 Income" 
        items={budget.income} 
        section="income" 
        onUpdate={updateBudgetItem} 
        onAdd={addBudgetItem} 
        onRemove={removeBudgetItem} 
      />

      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-dashed border-outline-variant"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest">Planned Outflow</span>
        </div>
      </div>
      
      <BudgetSection 
        title="🔴 Fixed Bills" 
        items={budget.fixedBills} 
        section="fixedBills" 
        onUpdate={updateBudgetItem} 
        onAdd={addBudgetItem} 
        onRemove={removeBudgetItem} 
        isExpense 
      />
      <BudgetSection 
        title="🔴 Food & Dining" 
        items={budget.food} 
        section="food" 
        onUpdate={updateBudgetItem} 
        onAdd={addBudgetItem} 
        onRemove={removeBudgetItem} 
        isExpense 
      />
      
      <BudgetSection 
        title="🟢 Savings Allocations" 
        items={budget.savings} 
        section="savings" 
        onUpdate={updateBudgetItem} 
        onAdd={addBudgetItem} 
        onRemove={removeBudgetItem} 
      />
      
      <BudgetSection 
        title="🟢 Wealth Investing" 
        items={budget.investing} 
        section="investing" 
        onUpdate={updateBudgetItem} 
        onAdd={addBudgetItem} 
        onRemove={removeBudgetItem} 
      />
      
      <BudgetSection 
        title="🔴 Fun & Lifestyle" 
        items={budget.funMoney} 
        section="funMoney" 
        onUpdate={updateBudgetItem} 
        onAdd={addBudgetItem} 
        onRemove={removeBudgetItem} 
        isExpense 
      />
    </div>
  )
}
