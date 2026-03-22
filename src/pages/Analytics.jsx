import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { useApp } from '../context/AppContext'

const COLORS = ['#D4AF37', '#FF5252', '#5D5FEF', '#00E676', '#C1C1FF']

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toLocaleString()}`
}

const PERIODS = ['3M', '6M', 'YTD', '1Y', 'ALL TIME']

export default function Analytics() {
  const { netWorthData, netWorth, totalAssets, totalLiabilities, budget, totalIncome, totalExpenses } = useApp()
  const [period, setPeriod] = useState('ALL TIME')

  const history = useMemo(() => {
    const h = netWorthData.history || []
    const now = new Date()
    const filterDate = {
      '3M': new Date(now.getFullYear(), now.getMonth() - 3, 1),
      '6M': new Date(now.getFullYear(), now.getMonth() - 6, 1),
      'YTD': new Date(now.getFullYear(), 0, 1),
      '1Y': new Date(now.getFullYear() - 1, now.getMonth(), 1),
      'ALL TIME': new Date(2000, 0, 1),
    }[period]
    return h
      .filter(d => new Date(d.date) >= filterDate)
      .map(d => ({ ...d, label: new Date(d.date).toLocaleDateString('en-US', { month: 'short' }) }))
  }, [netWorthData.history, period])

  const ytdChange = useMemo(() => {
    if (history.length < 2) return netWorth
    return history[history.length - 1]?.netWorth - history[0]?.netWorth
  }, [history, netWorth])

  const spendingBreakdown = useMemo(() => {
    const sections = [
      { name: 'Fixed Bills', key: 'fixedBills' },
      { name: 'Food', key: 'food' },
      { name: 'Fun Money', key: 'funMoney' },
      { name: 'Savings', key: 'savings' },
      { name: 'Investing', key: 'investing' },
    ]
    return sections
      .map(({ name, key }) => ({
        name,
        value: (budget[key] || []).reduce((s, i) => s + Number(i.planned || 0), 0),
      }))
      .filter(d => d.value > 0)
  }, [budget])

  const categoryBar = useMemo(() => {
    return [
      { name: 'Income', planned: budget.income.reduce((s, i) => s + Number(i.planned || 0), 0), actual: budget.income.reduce((s, i) => s + Number(i.actual || 0), 0) },
      { name: 'Bills', planned: budget.fixedBills.reduce((s, i) => s + Number(i.planned || 0), 0), actual: budget.fixedBills.reduce((s, i) => s + Number(i.actual || 0), 0) },
      { name: 'Food', planned: budget.food.reduce((s, i) => s + Number(i.planned || 0), 0), actual: budget.food.reduce((s, i) => s + Number(i.actual || 0), 0) },
      { name: 'Savings', planned: budget.savings.reduce((s, i) => s + Number(i.planned || 0), 0), actual: budget.savings.reduce((s, i) => s + Number(i.actual || 0), 0) },
      { name: 'Invest', planned: budget.investing.reduce((s, i) => s + Number(i.planned || 0), 0), actual: budget.investing.reduce((s, i) => s + Number(i.actual || 0), 0) },
    ]
  }, [budget])

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-body" style={{ color: p.color }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen px-4 pt-5 pb-4">
      <div className="mb-5">
        <h1 className="font-headline font-bold text-on-surface text-2xl">See Your Money Clearly</h1>
        <p className="text-gray-500 text-xs font-body mt-1">Track your wealth journey over time</p>
      </div>

      {/* Net Worth Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase">Net Worth Growth</p>
            <p className="font-headline font-bold text-on-surface text-2xl">{fmt(netWorth)} <span className="text-sm font-body font-normal text-gray-500">YTD</span></p>
            {ytdChange !== 0 && (
              <p className={`text-xs font-body mt-0.5 ${ytdChange >= 0 ? 'text-success' : 'text-error'}`}>
                {ytdChange >= 0 ? '+' : ''}{fmt(ytdChange)} this period
              </p>
            )}
          </div>
          <div className="flex gap-1">
            {PERIODS.map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`text-[9px] font-body font-bold px-2 py-1 rounded-full transition-colors ${
                  period === p ? 'bg-primary text-background' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={history.length ? history : [{ label: 'Now', netWorth: 0 }]}>
            <defs>
              <linearGradient id="nwGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333340" />
            <XAxis dataKey="label" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="netWorth" stroke="#D4AF37" strokeWidth={2} fill="url(#nwGrad)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Spending Breakdown Pie */}
      {spendingBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-surface border border-outline-variant rounded-2xl p-4 mb-4"
        >
          <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase mb-4">Spending Breakdown</p>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={spendingBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                  {spendingBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {spendingBreakdown.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-gray-400 text-xs font-body flex-1">{item.name}</span>
                  <span className="text-on-surface text-xs font-body font-medium">{fmt(item.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4 mb-4"
      >
        <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase mb-4">Planned vs Actual</p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={categoryBar} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333340" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="planned" name="Planned" fill="#D4AF37" opacity={0.6} radius={[4, 4, 0, 0]} />
            <Bar dataKey="actual" name="Actual" fill="#5D5FEF" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-4 justify-center mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-primary opacity-60" />
            <span className="text-gray-500 text-[10px] font-body">Planned</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-secondary" />
            <span className="text-gray-500 text-[10px] font-body">Actual</span>
          </div>
        </div>
      </motion.div>

      {/* Assets vs Liabilities */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-surface border border-outline-variant rounded-2xl p-4"
      >
        <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase mb-4">Assets vs Liabilities</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-body text-success">Assets</span>
              <span className="text-xs font-body font-medium text-success">{fmt(totalAssets)}</span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: totalAssets + totalLiabilities > 0 ? `${(totalAssets / (totalAssets + totalLiabilities)) * 100}%` : '0%' }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs font-body text-error">Liabilities</span>
              <span className="text-xs font-body font-medium text-error">-{fmt(totalLiabilities)}</span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-error rounded-full transition-all"
                style={{ width: totalAssets + totalLiabilities > 0 ? `${(totalLiabilities / (totalAssets + totalLiabilities)) * 100}%` : '0%' }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
