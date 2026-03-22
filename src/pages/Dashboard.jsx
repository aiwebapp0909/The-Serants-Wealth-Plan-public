import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useAI } from '../hooks/useAI'
import { useState, useEffect } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

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
    budget, healthScore, goals
  } = useApp()
  const { userProfile, user, logout } = useAuth()
  const { insight, loading: aiLoading, generateInsight } = useAI()
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [groupIdInput, setGroupIdInput] = useState('')

  const savings = totalIncome - totalExpenses
  const savingsRate = totalIncome > 0 ? Math.round((savings / totalIncome) * 100) : 0
  
  const wealthScore = useMemo(() => {
    const totalGoals = goals.filter(g => !g.isUltimate)
    if (totalGoals.length === 0) return 0
    const overallProgress = totalGoals.reduce((sum, g) => {
      const p = g.target === 0 ? 0 : Math.min(100, (g.current / g.target) * 100)
      return sum + p
    }, 0)
    return Math.round(overallProgress / totalGoals.length)
  }, [goals])

  useEffect(() => {
    if (userProfile && !insight && !aiLoading) {
      generateInsight({
        netWorth: Math.abs(netWorth),
        income: totalIncome,
        expenses: totalExpenses,
        savingsRate,
        healthScore,
        nextGoal: nextImmediateGoal?.name || 'Emergency Fund'
      })
    }
  }, [userProfile, netWorth, totalIncome, totalExpenses, savingsRate, healthScore, nextImmediateGoal])

  const handleJoinGroup = async () => {
    if (!groupIdInput.trim() || !user) return
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        groupId: groupIdInput.trim()
      })
      alert('Joined group successfully! Refreshing...')
      window.location.reload()
    } catch (e) {
      console.error(e)
    }
  }

  const SyncButton = () => (
    <button
      onClick={() => setShowSyncModal(true)}
      className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-body font-medium transition-colors ${userProfile?.groupId ? 'bg-success/10 border-success/40 text-success' : 'bg-surface-container border-outline-variant text-on-surface hover:border-primary/50'}`}
    >
      <span className={userProfile?.groupId ? 'text-success' : 'text-primary'}>⚡</span>
      {userProfile?.groupId ? 'Synced' : 'Couple Sync'}
    </button>
  )

  const SyncModal = () => (
    <AnimatePresence>
      {showSyncModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSyncModal(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-on-surface text-xl">Couple Sync</h2>
              <button onClick={() => setShowSyncModal(false)} className="text-gray-500 hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-surface-container rounded-2xl p-4 flex items-center gap-3">
                <img src={user?.photoURL} alt="" className="w-10 h-10 rounded-full border border-outline-variant" />
                <div className="flex-1">
                  <p className="text-sm font-body font-bold text-on-surface">{user?.displayName}</p>
                  <p className="text-[10px] text-gray-500 font-body truncate">{user?.email}</p>
                </div>
                <button onClick={logout} className="text-error text-[10px] font-body font-bold uppercase tracking-wider">Logout</button>
              </div>

              {userProfile?.groupId ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-success/5 border border-success/20">
                    <p className="text-[9px] text-success font-body font-bold uppercase tracking-widest mb-1">Active Group ID</p>
                    <p className="text-sm font-headline font-bold text-on-surface select-all">{userProfile.groupId}</p>
                  </div>
                  <p className="text-xs text-gray-500 font-body text-center leading-relaxed">
                    You are syncing with your partner. Every dollar change is visible to both.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <p className="text-xs text-gray-500 font-body text-center">
                    Enter your partner's Group ID to sync your wealth plan together.
                  </p>
                  <input
                    type="text"
                    placeholder="Enter Group ID"
                    value={groupIdInput}
                    onChange={(e) => setGroupIdInput(e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm font-body text-on-surface focus:border-primary outline-none text-center"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        const newId = Math.random().toString(36).substring(2, 9).toUpperCase()
                        setGroupIdInput(newId)
                      }}
                      className="bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl py-3 text-xs font-body font-bold text-on-surface transition-colors"
                    >
                      GENERATE NEW
                    </button>
                    <button
                      onClick={handleJoinGroup}
                      className="bg-primary text-background rounded-xl py-3 text-xs font-body font-bold hover:bg-primary/90 transition-colors"
                    >
                      JOIN GROUP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )

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
          <SyncButton />
        </div>
      </div>

      <SyncModal />

      <div className="px-4 space-y-3 pb-4">
        {/* Row 1: Wealth Score Hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-surface border border-outline-variant rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10">
            <span className="material-symbols-outlined text-7xl">auto_graph</span>
          </div>
          <p className="text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1">Wealth Score</p>
          <div className="flex items-end gap-2 mb-4">
            <h2 className="font-headline font-bold text-on-surface text-5xl leading-none">{wealthScore}%</h2>
            <p className="text-gray-500 text-xs font-body mb-1 uppercase tracking-tight">to Financial Freedom</p>
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${wealthScore}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            />
          </div>
        </motion.div>

        {/* Row 2: Stats Grid */}
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

        {/* Row 2: Net Worth + Health Score */}
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

          {/* Health Score */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>thermostat</span>
              </div>
              <span className={`text-[8px] font-body font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${healthScore >= 70 ? 'bg-success/10 text-success' : healthScore >= 40 ? 'bg-amber-400/10 text-amber-400' : 'bg-error/10 text-error'}`}>
                {healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'Good' : 'Needs Work'}
              </span>
            </div>
            <div>
              <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase">Health Score</p>
              <p className="font-headline font-bold text-on-surface text-4xl mt-1">{healthScore}</p>
              <div className="mt-2 h-1 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${healthScore}%` }}
                  className={`h-full rounded-full ${healthScore >= 70 ? 'bg-success' : healthScore >= 40 ? 'bg-amber-400' : 'bg-error'}`}
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Row 3: Ultimate Goal */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-surface border border-outline-variant rounded-2xl p-4 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <span className="material-symbols-outlined text-6xl">workspace_premium</span>
          </div>
          <p className="text-[9px] font-body font-semibold tracking-widest text-gray-500 uppercase mb-4">Ultimate Goal</p>
          <div className="flex items-end justify-between">
            <div>
              <p className="font-headline font-bold text-on-surface text-4xl">
                {ultimateGoal ? fmt(ultimateGoal.target) : '$20.0M'}
              </p>
              <p className="text-gray-500 text-[10px] font-body mt-1">THE END IN MIND</p>
            </div>
            {ultimateGoal && (
              <div className="text-right">
                <p className="text-amber-400 font-headline font-bold text-xl">{pct(netWorth, ultimateGoal.target)}%</p>
                <p className="text-gray-600 text-[8px] font-body uppercase tracking-widest">Complete</p>
              </div>
            )}
          </div>
          {ultimateGoal && (
            <div className="mt-4 h-1.5 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct(netWorth, ultimateGoal.target)}%` }}
                className="h-full bg-amber-400 rounded-full"
              />
            </div>
          )}
        </motion.div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary">psychology</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-body font-bold text-primary uppercase tracking-widest">AI Financial Coach</p>
              {aiLoading && <div className="w-3 h-3 border-2 border-primary/40 border-t-primary animate-spin rounded-full" />}
            </div>
            {aiLoading ? (
              <div className="space-y-1.5 w-full">
                <div className="h-3 bg-primary/10 rounded w-full animate-pulse" />
                <div className="h-3 bg-primary/10 rounded w-2/3 animate-pulse" />
              </div>
            ) : (
              <p className="text-sm font-body text-on-surface leading-normal italic">
                "{insight || "Based on your data, I'm analyzing your path to $20.0M. Generating advice..."}"
              </p>
            )}
          </div>
        </motion.div>

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
