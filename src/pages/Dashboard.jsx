import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useAI } from '../hooks/useAI'
import { useState, useEffect, useMemo } from 'react'
import { db } from '../firebase'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import CoachChat from '../components/CoachChat'

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function pct(current, target) {
  if (!target || target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

const PIE_COLORS = ['#5D5FEF', '#00E676', '#FF5252', '#FF9800', '#C1C1FF', '#D4AF37']

export default function Dashboard() {
  const {
    netWorth, totalAssets, totalLiabilities,
    totalIncome, totalExpenses, totalSavings, totalInvesting,
    budget, activeGoals, healthScore, getActual,
    currentMonth, switchMonth
  } = useApp()
  
  const { user, logout } = useAuth()
  const { insight, loading: aiLoading, generateInsight } = useAI()
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [showCoachChat, setShowCoachChat] = useState(false)
  const [transactions, setTransactions] = useState([])
  const [flowPeriod, setFlowPeriod] = useState('6M')
  const [txFilter, setTxFilter] = useState('All')

  const totalSaved = useMemo(() => totalSavings + totalInvesting, [totalSavings, totalInvesting])
  const savingsGoalTotal = useMemo(() => {
    return activeGoals.reduce((s, g) => s + (g.current || 0), 0)
  }, [activeGoals])

  useEffect(() => {
    if (user && !insight && !aiLoading) {
      generateInsight({
        netWorth: Math.abs(netWorth),
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSaved,
        healthScore,
      })
    }
  }, [user])

  // Fetch recent transactions from Firestore
  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'transactions'), where('userId', '==', user.uid))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      txs.sort((a, b) => new Date(b.date) - new Date(a.date))
      setTransactions(txs)
    })
    return unsubscribe
  }, [user])

  const filteredTransactions = useMemo(() => {
    let filtered = transactions
    if (txFilter === 'Income') filtered = filtered.filter(t => t.isExpense === false)
    if (txFilter === 'Expense') filtered = filtered.filter(t => t.isExpense !== false)
    return filtered.slice(0, 7) // Show top 7 recent
  }, [transactions, txFilter])

  // Month selector logic
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
    const now = new Date()
    const isCurrent = now.getFullYear() === Number(year) && now.getMonth() + 1 === Number(month)
    return isCurrent ? 'This Month' : new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }, [currentMonth])

  // Last month comparison mathematically
  const diffs = useMemo(() => {
    const [year, month] = currentMonth.split('-')
    const d = new Date(year, month - 1, 1)
    d.setMonth(d.getMonth() - 1)
    const prevStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`

    const prevTxs = transactions.filter(t => t.date && t.date.startsWith(prevStr))
    const prevInc = prevTxs.filter(t => !t.isExpense).reduce((a, t) => a + Math.abs(t.amount || 0), 0)
    const prevExp = prevTxs.filter(t => t.isExpense).reduce((a, t) => a + Math.abs(t.amount || 0), 0)
    const prevSav = prevTxs.filter(t => t.category === 'Savings' || t.category === 'Investing').reduce((a, t) => a + Math.abs(t.amount || 0), 0)

    const calcObj = (current, prev) => {
      if (prev === 0) return { val: 0, text: 'vs last month' }
      const diff = ((current - prev) / prev) * 100
      return { val: diff, text: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}% vs last month` }
    }

    return {
      income: calcObj(totalIncome, prevInc),
      expense: calcObj(totalExpenses, prevExp),
      savings: calcObj(totalSaved, prevSav)
    }
  }, [transactions, currentMonth, totalIncome, totalExpenses, totalSaved])

  // Money flow chart data
  const flowData = useMemo(() => {
    const mCount = flowPeriod === '3M' ? 3 : flowPeriod === '6M' ? 6 : 12
    const data = []
    for (let i = mCount - 1; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      
      const monTxs = transactions.filter(t => t.date && t.date.startsWith(mStr))
      const mInc = monTxs.filter(t => !t.isExpense).reduce((a, t) => a + Math.abs(t.amount || 0), 0)
      const mExp = monTxs.filter(t => t.isExpense).reduce((a, t) => a + Math.abs(t.amount || 0), 0)

      data.push({
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        Income: mInc,
        Expense: mExp,
      })
    }
    // ensure current month gets contextual data if not synced yet
    if (data.length > 0) {
      data[data.length - 1].Income = Math.max(data[data.length - 1].Income, totalIncome)
      data[data.length - 1].Expense = Math.max(data[data.length - 1].Expense, totalExpenses)
    }
    return data
  }, [flowPeriod, transactions, totalIncome, totalExpenses])

  // Budget breakdown data
  const spendingData = useMemo(() => {
    if (!getActual) return []
    return [
      { name: 'Housing', value: Math.abs(getActual('Housing')) },
      { name: 'Bills & Util', value: Math.abs(getActual('Bills & Utilities')) },
      { name: 'Food & Dining', value: Math.abs(getActual('Food & Dining')) },
      { name: 'Transport', value: Math.abs(getActual('Transportation')) },
      { name: 'Shopping', value: Math.abs(getActual('Shopping')) },
      { name: 'Entertainment', value: Math.abs(getActual('Entertainment')) },
      { name: 'Other', value: Math.abs(getActual('Other')) }
    ].filter(d => d.value > 0)
  }, [budget, getActual])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-body font-bold" style={{ color: p.fill || p.color }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    )
  }

  const TrendPill = ({ diff, isGoodPositive = true }) => {
    if (!diff.val) return <span className="text-[10px] text-gray-500 font-body">N/A vs last month</span>
    const isGood = isGoodPositive ? diff.val >= 0 : diff.val <= 0
    return (
      <span className={`text-[10px] font-body font-bold px-2 py-0.5 rounded-full mr-1 
        ${isGood ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
      >
        <span className="material-symbols-outlined text-[10px] align-middle mr-0.5">
          {diff.val >= 0 ? 'trending_up' : 'trending_down'}
        </span>
        {diff.text.split(' ')[0]}
      </span>
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* PERFECTLY MATCHED HEADER */}
      <div className="flex items-center justify-between px-6 pt-8 pb-6">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-3xl leading-tight inline-flex items-center gap-2">
            Welcome back, {user?.displayName || 'User'}! <span>👋</span>
          </h1>
          <p className="text-sm font-body text-gray-400 mt-1">Here's a snapshot of your finances.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSyncModal(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full border border-success/40 bg-success/10 text-success hover:bg-success/20 transition-colors"
            title="Account Connected"
          >
            <span className="material-symbols-outlined text-xl">account_balance</span>
          </button>
          <div className="relative">
            <select
              value={currentMonth}
              onChange={(e) => switchMonth(e.target.value)}
              className="appearance-none bg-surface-container border border-outline-variant hover:border-primary/50 text-on-surface font-body font-bold text-sm rounded-xl pl-4 pr-10 py-2.5 outline-none cursor-pointer transition-all"
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">calendar_today</span>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-5 pb-24">
        {/* ROW 1: 4 STAT CARDS (Matched exact values & styling intent) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Balance */}
          <Link to="/analytics" className="bg-surface border border-outline-variant rounded-2xl p-5 hover:border-primary/30 transition-all active:scale-[0.98] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-body text-gray-400">Total Balance</p>
              <span className="material-symbols-outlined text-gray-500 text-sm">north_east</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-primary text-[15px]">account_balance_wallet</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-3xl mb-1">{fmt(netWorth)}</h2>
            <p className="text-[11px] font-body text-gray-500">All-time net balance</p>
          </Link>

          {/* Income */}
          <Link to="/budget" className="bg-surface border border-outline-variant rounded-2xl p-5 hover:border-success/30 transition-all active:scale-[0.98] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-body text-gray-400">Income</p>
              <span className="material-symbols-outlined text-gray-500 text-sm">north_east</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-success text-[15px]">trending_up</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-3xl mb-1">{fmt(totalIncome)}</h2>
            <div className="flex items-center text-gray-500 text-[11px] font-body mt-2">
              <TrendPill diff={diffs.income} isGoodPositive={true} /> 
              {diffs.income.val !== 0 && 'vs last month'}
            </div>
          </Link>

          {/* Expenses */}
          <Link to="/budget" className="bg-surface border border-outline-variant rounded-2xl p-5 hover:border-error/30 transition-all active:scale-[0.98] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-body text-gray-400">Expenses</p>
              <span className="material-symbols-outlined text-gray-500 text-sm">north_east</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-error text-[15px]">trending_down</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-3xl mb-1">{fmt(totalExpenses)}</h2>
            <div className="flex items-center text-gray-500 text-[11px] font-body mt-2">
              <TrendPill diff={diffs.expense} isGoodPositive={false} /> 
              {diffs.expense.val !== 0 && 'vs last month'}
            </div>
          </Link>

          {/* Total Savings */}
          <Link to="/goals" className="bg-surface border border-outline-variant rounded-2xl p-5 hover:border-secondary/30 transition-all active:scale-[0.98] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[13px] font-body text-gray-400">Total Savings</p>
              <span className="material-symbols-outlined text-gray-500 text-sm">north_east</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-secondary text-[15px]">savings</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-3xl mb-1">{fmt(totalSaved)}</h2>
            <div className="text-[10px] font-body text-gray-400 mb-2">
              🎯 <span className="text-secondary font-bold">${savingsGoalTotal.toLocaleString()}</span> saved toward goals
            </div>
            <div className="flex items-center text-gray-500 text-[11px] font-body mt-1.5">
              <TrendPill diff={diffs.savings} isGoodPositive={true} /> 
              {diffs.savings.val !== 0 && 'vs last month'}
            </div>
          </Link>
        </div>

        {/* ROW 2: MONEY FLOW + BUDGET BREAKDOWN */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Money Flow Chart */}
          <div className="lg:col-span-3 bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-headline font-bold text-on-surface text-base">Money Flow</h3>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                     <span className="text-[11px] font-body text-gray-400">Income</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2.5 h-2.5 rounded-full bg-[#8b8cf8]" />
                     <span className="text-[11px] font-body text-gray-400">Expense</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 bg-surface-container rounded-full p-1 border border-outline-variant/50">
                {['3M', '6M', '1Y'].map(p => (
                  <button
                    key={p}
                    onClick={() => setFlowPeriod(p)}
                    className={`text-[10px] font-body font-bold px-4 py-1.5 rounded-full transition-all ${
                      flowPeriod === p ? 'bg-primary text-background shadow-sm' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {p === '3M' ? '3 Months' : p === '6M' ? '6 Months' : '1 Year'}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={flowData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222230" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} />
                <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <Bar dataKey="Income" fill="#D4AF37" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="Expense" fill="#8b8cf8" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget Breakdown */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="font-headline font-bold text-on-surface text-base mb-1">Budget Breakdown</h3>
            <p className="text-[11px] font-body text-gray-400 mb-6">Expenses by category this month</p>
            
            {spendingData.length > 0 ? (
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex justify-center mb-6">
                  <ResponsiveContainer width={180} height={180}>
                    <PieChart>
                      <Pie data={spendingData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" strokeWidth={0} paddingAngle={2}>
                        {spendingData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-surface-container/20 rounded-xl">
                <span className="material-symbols-outlined text-gray-500 text-4xl mb-3 opacity-50">pie_chart</span>
                <p className="text-gray-400 text-xs">Connect a bank to see breakdown</p>
              </div>
            )}
          </div>
        </div>

        {/* ROW 3: RECENT TRANSACTIONS + SAVING GOALS */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Recent Transactions */}
          <div className="lg:col-span-3 bg-surface border border-outline-variant rounded-2xl overflow-hidden shadow-sm flex flex-col pb-2">
            <div className="px-6 py-5 flex items-center justify-between border-b border-outline-variant/50">
              <h3 className="font-headline font-bold text-on-surface text-base">Recent Transactions</h3>
              <div className="flex gap-1 bg-surface-container rounded-full p-1 border border-outline-variant/30">
                {['All', 'Income', 'Expense'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTxFilter(f)}
                    className={`text-[10px] font-body font-bold px-3 py-1 rounded-full transition-all ${
                      txFilter === f ? 'bg-primary/20 text-primary shadow-sm' : 'text-gray-500 hover:text-gray-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
            
            {filteredTransactions.length > 0 ? (
              <div className="flex-1 overflow-x-auto p-4 pt-2">
                <table className="w-full">
                  <thead>
                    <tr className="text-[9px] font-body text-primary uppercase tracking-widest font-bold mb-2">
                      <th className="text-left px-3 py-3 w-1/3">Name</th>
                      <th className="text-left px-3 py-3 w-1/4">Date</th>
                      <th className="text-left px-3 py-3 w-1/6">Type</th>
                      <th className="text-right px-3 py-3 w-1/4">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((tx, i) => (
                      <tr key={tx.id} className={`group transition-colors ${i !== filteredTransactions.length - 1 ? 'border-b border-outline-variant/30' : ''}`}>
                        <td className="px-3 py-3.5">
                          <p className="text-[13px] font-body text-on-surface font-medium truncate">{tx.merchant || tx.name}</p>
                          <p className="text-[11px] text-gray-500 truncate mt-0.5">{tx.category || 'Uncategorized'}</p>
                        </td>
                        <td className="px-3 py-3.5 text-xs text-gray-400">{tx.date}</td>
                        <td className="px-3 py-3.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            tx.isExpense === false ? 'bg-success/10 text-success border-success/20' : 'bg-error/10 text-error border-error/20'
                          }`}>
                            {tx.isExpense === false ? 'income' : 'expense'}
                          </span>
                        </td>
                        <td className={`px-3 py-3.5 text-[13px] text-right font-body font-bold ${
                          tx.isExpense === false ? 'text-success' : 'text-error'
                        }`}>
                          {tx.isExpense === false ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-gray-600 text-3xl mb-3 opacity-50">receipt</span>
                <p className="text-gray-500 text-[13px]">No recent transactions found.</p>
              </div>
            )}
          </div>

          {/* Saving Goals */}
          <div className="lg:col-span-2 bg-surface border border-outline-variant rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-headline font-bold text-on-surface text-base">Saving Goals</h3>
              <span className="text-[11px] font-body text-gray-500">{activeGoals.length} goals</span>
            </div>
            
            {activeGoals.length > 0 ? (
              <div className="space-y-6">
                {activeGoals.slice(0, 3).map(goal => {
                  const progress = pct(goal.current, goal.target)
                  // Colors logic matches reference UI progress bar logic: simple uniform bar colors.
                  const barColor = 'bg-[#5D5FEF]'

                  return (
                    <div key={goal.id} className="group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                           {goal.name.toLowerCase().includes('car') && <span className="text-base flex-shrink-0">🚗</span>}
                           {goal.name.toLowerCase().includes('vacation') && <span className="text-base flex-shrink-0">🏖️</span>}
                           {goal.name.toLowerCase().includes('emergency') && <span className="text-base flex-shrink-0">🏠</span>}
                           {(!goal.name.toLowerCase().match(/car|vacation|emergency/)) && <span className="text-base flex-shrink-0">🎯</span>}
                           
                           <p className="text-[13px] font-body text-on-surface font-medium truncate">{goal.name}</p>
                        </div>
                        <p className="text-[11px] font-body text-gray-500 flex-shrink-0 text-right min-w-[100px]">
                          {fmt(goal.current)} / <span className="text-on-surface font-bold">{fmt(goal.target)}</span>
                        </p>
                      </div>
                      <div className="h-2.5 bg-surface-container-high rounded-full overflow-hidden mb-1.5 flex shadow-inner">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          className={`h-full rounded-full ${barColor}`}
                        />
                      </div>
                      <p className="text-right text-[10px] font-body font-bold text-gray-500">{progress}%</p>
                    </div>
                  )
                })}
                <Link to="/goals" className="text-primary text-[11px] font-body font-bold hover:underline block pt-2">
                  See all goals →
                </Link>
              </div>
            ) : (
              <div className="text-center py-10 bg-surface-container/20 rounded-xl">
                <span className="material-symbols-outlined text-gray-500 text-3xl mb-3 opacity-50">flag</span>
                <p className="text-gray-400 text-xs mb-3">No active goals yet.</p>
                <Link to="/goals" className="inline-block bg-primary text-background font-bold text-[10px] px-4 py-2 rounded-full shadow hover:bg-primary/90 transition-colors">
                  Create a Goal
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODALS */}
      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={() => setShowSyncModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl">
            <h2 className="font-headline font-bold text-on-surface text-xl mb-6 text-center">Account Status</h2>
            <div className="space-y-4">
              <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant">
                <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest mb-1">Logged In As</p>
                <p className="font-headline font-bold text-primary text-sm tracking-wide">{user?.email}</p>
              </div>
              <div className="text-center mt-6">
                 <button onClick={logout} className="w-full bg-error/10 border border-error/20 text-error rounded-xl py-3 text-sm font-bold font-headline hover:bg-error/20 transition-colors">LOGOUT</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Coach Chat Overlay */}
      <CoachChat 
        isOpen={showCoachChat}
        onClose={() => setShowCoachChat(false)}
        financialData={{
          income: totalIncome,
          expenses: totalExpenses,
          savings: totalSavings,
          investing: totalInvesting,
          netWorth: netWorth,
          healthScore: healthScore
        }}
        userId={user?.uid}
      />
    </div>
  )
}
