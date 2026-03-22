import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function fmt(n, short = false) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (short && Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function pct(current, target) {
  if (!target) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export default function Dashboard() {
  const {
    netWorth, totalAssets, totalLiabilities,
    totalIncome, totalExpenses, totalPlannedIncome, totalPlannedExpenses,
    nextImmediateGoal, nextGoal, ultimateGoal,
    budget,
  } = useApp()

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0

  const totalSavings = budget.savings.reduce((s, i) => s + Number(i.actual || 0), 0)
  const totalInvesting = budget.investing.reduce((s, i) => s + Number(i.actual || 0), 0)

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-base">people</span>
          </div>
          <span className="font-headline font-bold text-on-surface text-lg">WealthSync</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button className="flex items-center gap-1.5 bg-surface-container border border-outline-variant rounded-full px-3 py-1.5 text-xs font-body font-medium text-on-surface hover:border-primary/50 transition-colors">
            <span className="text-primary">⚡</span>
            Couple Sync
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-4">
        {/* Row 1: Goals */}
        <div className="grid grid-cols-2 gap-3">
          {/* Next Immediate Goal */}
          <Link to="/goals">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-[#12121A] border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between relative overflow-hidden hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase">Next Immediate Goal</span>
                  <div className="w-6 h-6 rounded-full border border-dashed border-gray-600 flex items-center justify-center">
                    <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '12px' }}>my_location</span>
                  </div>
                </div>
                <p className="font-headline font-bold text-on-surface text-lg leading-tight">
                  {nextImmediateGoal ? nextImmediateGoal.name : 'Set a Goal'}
                </p>
                <p className="text-gray-500 text-xs font-body mt-1">
                  {nextImmediateGoal
                    ? `${fmt(nextImmediateGoal.current)} / ${fmt(nextImmediateGoal.target)}`
                    : 'No active goal'}
                </p>
              </div>
              <div>
                <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${nextImmediateGoal ? pct(nextImmediateGoal.current, nextImmediateGoal.target) : 0}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
              </div>
            </motion.div>
          </Link>

          {/* Next Goal */}
          <Link to="/goals">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase">Next Goal</span>
                  <span className="material-symbols-outlined text-gray-500" style={{ fontSize: '14px' }}>tune</span>
                </div>
                {nextGoal ? (
                  <>
                    <span className="inline-block text-[9px] font-body font-bold text-success tracking-wider uppercase mb-1">
                      {nextGoal.phase}
                    </span>
                    <p className="font-headline font-bold text-on-surface text-sm leading-tight">
                      {nextGoal.name}
                    </p>
                    <p className="text-gray-500 text-[10px] font-body mt-1 line-clamp-2">
                      {nextGoal.description}
                    </p>
                  </>
                ) : (
                  <p className="text-gray-500 text-xs font-body mt-2">All goals complete!</p>
                )}
              </div>
              {nextGoal && (
                <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct(nextGoal.current, nextGoal.target)}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                    className="h-full bg-secondary rounded-full"
                  />
                </div>
              )}
            </motion.div>
          </Link>
        </div>

        {/* Row 2: Net Worth + Ultimate Goal */}
        <div className="grid grid-cols-2 gap-3">
          {/* Net Worth */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-surface border border-outline-variant rounded-2xl p-4"
          >
            <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase mb-2">Calculated Net Worth</p>
            <p className="font-headline font-bold text-on-surface text-3xl">
              {netWorth < 0 ? '-' : ''}{fmt(Math.abs(netWorth))}
            </p>
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Total Assets</span>
                <span className="text-[11px] font-body font-medium text-success ml-auto">{fmt(totalAssets)}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Total Debt</span>
                <span className="text-[11px] font-body font-medium text-error ml-auto">-{fmt(totalLiabilities)}</span>
              </div>
            </div>
          </motion.div>

          {/* Ultimate Goal */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-error/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-error" style={{ fontSize: '16px' }}>flag</span>
              </div>
              <span className="text-[8px] font-body font-bold text-amber-400 uppercase tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-full">
                The End in Mind
              </span>
            </div>
            <div>
              <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase">Ultimate Goal</p>
              <p className="font-headline font-bold text-on-surface text-3xl mt-1">
                {ultimateGoal ? fmt(ultimateGoal.target) : '$20M'}
              </p>
              {ultimateGoal && (
                <div className="mt-2">
                  <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct(netWorth, ultimateGoal.target)}%` }}
                      transition={{ duration: 1.2, ease: 'easeOut', delay: 0.5 }}
                      className="h-full bg-amber-400 rounded-full"
                    />
                  </div>
                  <p className="text-gray-600 text-[10px] font-body mt-1">
                    {pct(netWorth, ultimateGoal.target)}% complete
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Monthly Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-surface border border-outline-variant rounded-2xl p-4"
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-body font-semibold text-gray-400 uppercase tracking-wider">Monthly Overview</p>
            <Link to="/budget" className="text-primary text-xs font-body">View Budget →</Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Income', value: fmt(totalIncome, true), color: 'text-success', icon: 'arrow_downward' },
              { label: 'Spending', value: fmt(totalExpenses, true), color: 'text-error', icon: 'arrow_upward' },
              { label: 'Saved', value: fmt(Math.max(0, savings), true), color: 'text-primary', icon: 'savings' },
            ].map(({ label, value, color, icon }) => (
              <div key={label} className="bg-surface-container rounded-xl p-3 text-center">
                <span className={`material-symbols-outlined ${color} text-base`}>{icon}</span>
                <p className={`font-headline font-bold ${color} text-lg mt-1`}>{value}</p>
                <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Savings Rate */}
        {totalIncome > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface border border-outline-variant rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-body font-semibold text-gray-400 uppercase tracking-wider">Savings Rate</p>
              <span className={`text-sm font-headline font-bold ${savingsRate >= 20 ? 'text-success' : savingsRate >= 10 ? 'text-primary' : 'text-error'}`}>
                {savingsRate}%
              </span>
            </div>
            <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, savingsRate)}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.4 }}
                className={`h-full rounded-full ${savingsRate >= 20 ? 'bg-success' : savingsRate >= 10 ? 'bg-primary' : 'bg-error'}`}
              />
            </div>
            <p className="text-gray-600 text-[10px] font-body mt-1.5">
              Target: 20%+ for financial freedom
            </p>
          </motion.div>
        )}

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="grid grid-cols-2 gap-3"
        >
          <Link to="/invest">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 hover:border-secondary/50 transition-colors">
              <span className="material-symbols-outlined text-secondary mb-2 text-xl">show_chart</span>
              <p className="font-headline font-bold text-on-surface text-sm">Investment</p>
              <p className="text-gray-500 text-[10px] font-body">Projection calculator</p>
            </div>
          </Link>
          <Link to="/tools">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 hover:border-primary/50 transition-colors">
              <span className="material-symbols-outlined text-primary mb-2 text-xl">calculate</span>
              <p className="font-headline font-bold text-on-surface text-sm">Tax & Mortgage</p>
              <p className="text-gray-500 text-[10px] font-body">Financial calculators</p>
            </div>
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
