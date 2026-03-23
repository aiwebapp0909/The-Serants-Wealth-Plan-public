import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useAI } from '../hooks/useAI'
import { useState, useEffect } from 'react'

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function pct(current, target) {
  if (!target || target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

export default function Dashboard() {
  const {
    netWorth, totalAssets, totalLiabilities,
    totalIncome, totalExpenses, totalSavings, totalInvesting,
    nextImmediateGoal, nextGoal, ultimateGoal,
    healthScore, unassigned
  } = useApp()
  
  const { user, logout } = useAuth()
  const { insight, loading: aiLoading, generateInsight } = useAI()
  const [showSyncModal, setShowSyncModal] = useState(false)

  useEffect(() => {
    if (user && !insight && !aiLoading) {
      generateInsight({
        netWorth: Math.abs(netWorth),
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSavings + totalInvesting,
        healthScore,
        nextGoal: nextImmediateGoal?.name || 'Emergency Fund'
      })
    }
  }, [user, netWorth, totalIncome, totalExpenses, healthScore, nextImmediateGoal])

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="material-symbols-outlined text-background text-xl font-bold">handshake</span>
            </div>
            <div className="absolute -top-1 -right-1">
               <span className="material-symbols-outlined text-amber-500 text-[14px]">star</span>
            </div>
          </div>
          <div>
            <h1 className="font-headline font-bold text-on-surface text-lg leading-tight uppercase tracking-tight">Serant Wealth</h1>
            <p className="text-[8px] font-body font-bold text-amber-500 uppercase tracking-widest -mt-1">Operating System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-on-surface">
            <span className="material-symbols-outlined text-xl">notifications</span>
          </button>
          <button 
            onClick={() => setShowSyncModal(true)}
            className="flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-body font-bold transition-all bg-success/10 border-success/40 text-success"
          >
            <span className="text-success text-[10px]">●</span>
            Connected
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-24">
        {/* ROW 1: GOALS GRID */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/goals">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between relative overflow-hidden active:scale-[0.98] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest">Next Immediate</span>
                  <span className="material-symbols-outlined text-gray-600 text-[16px]">my_location</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
                  {nextImmediateGoal?.name || 'Starter EF'}
                </h3>
              </div>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct(nextImmediateGoal?.current, nextImmediateGoal?.target)}%` }} className="h-full bg-primary rounded-full" />
              </div>
            </div>
          </Link>

          <Link to="/goals">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between active:scale-[0.98] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest">Next Milestone</span>
                  <span className="material-symbols-outlined text-gray-600 text-[16px]">tune</span>
                </div>
                {nextGoal ? (
                  <>
                     <h3 className="font-headline font-bold text-on-surface text-sm leading-tight">{nextGoal.name}</h3>
                     <p className="text-gray-500 text-[10px] font-body mt-1 line-clamp-2">{nextGoal.description}</p>
                  </>
                ) : (
                  <p className="text-gray-500 text-[10px] font-body">All goals complete!</p>
                )}
              </div>
            </div>
          </Link>
        </div>

        {/* ROW 2: LEFT TO PLAN + HEALTH GRID */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/budget">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between cursor-pointer active:bg-surface-container transition-all">
              <div>
                <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-2">Left to Plan</p>
                <h2 className={`font-headline font-bold text-3xl ${unassigned > 0 ? 'text-primary' : unassigned < 0 ? 'text-error' : 'text-success'}`}>
                  {fmt(unassigned)}
                </h2>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[9px] font-body">
                  <span className="text-gray-500 uppercase font-bold tracking-widest">Unassigned</span>
                  <span className={unassigned !== 0 ? 'text-primary font-bold' : 'text-success font-bold'}>{unassigned === 0 ? 'Perfect ✅' : fmt(unassigned)}</span>
                </div>
                <div className="flex justify-between items-center text-[9px] font-body">
                  <span className="text-on-surface/60 font-medium">NW: {fmt(netWorth)}</span>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/analytics">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between relative cursor-pointer active:bg-surface-container transition-all">
               <div className="absolute top-4 right-4 text-[8px] font-body font-bold text-amber-500 border border-amber-500/30 px-1.5 py-0.5 rounded">
                 HEALTH
               </div>
               <div>
                  <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-2">Score</p>
                  <h2 className="font-headline font-bold text-on-surface text-4xl">{healthScore}</h2>
               </div>
               <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} className={`h-full rounded-full ${healthScore >= 70 ? 'bg-success' : 'bg-amber-500'}`} />
               </div>
            </div>
          </Link>
        </div>

        {/* ROW 3: ULTIMATE GOAL (CAROUSEL STYLE) */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 relative overflow-hidden bg-gradient-to-br from-surface to-[#1A1B23]">
           <div className="absolute top-0 right-0 p-5 opacity-5">
              <span className="material-symbols-outlined text-7xl font-bold">stars</span>
           </div>
           <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-3">Roadmap Target</p>
           <div className="flex items-end justify-between mb-4">
              <div>
                 <h2 className="font-headline font-bold text-on-surface text-4xl">{ultimateGoal ? fmt(ultimateGoal.target) : '$20.0M'}</h2>
                 <p className="text-gray-500 text-[10px] font-body uppercase tracking-widest mt-1">Financial Freedom</p>
              </div>
              <div className="text-right">
                 <p className="font-headline font-bold text-primary text-xl">{pct(netWorth, ultimateGoal?.target)}%</p>
                 <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest">Complete</p>
              </div>
           </div>
           <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct(netWorth, ultimateGoal?.target)}%` }} className="h-full bg-primary rounded-full" />
           </div>
        </div>

        {/* ROW 4: COACH INSIGHT */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
          </div>
          <div className="flex-1">
             <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-body font-bold text-primary uppercase tracking-widest">Coach Insight</p>
                {aiLoading && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
             </div>
             <p className="text-xs font-body text-on-surface/80 italic leading-relaxed">"{insight || 'Synthesizing your path to freedom...'}"</p>
          </div>
        </motion.div>
      </div>

      {/* ACCOUNT INFO MODAL */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSyncModal(false)} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl">
              <h2 className="font-headline font-bold text-on-surface text-xl mb-6 text-center">Account Status</h2>
              <div className="space-y-4">
                <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant">
                  <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest mb-1">Logged In As</p>
                  <p className="font-headline font-bold text-primary text-sm tracking-wide">{user?.email}</p>
                </div>
                <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant">
                  <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest mb-1">User ID</p>
                  <p className="font-mono text-xs text-gray-400 break-all">{user?.uid}</p>
                </div>
                <p className="text-[10px] text-gray-500 text-center font-body uppercase tracking-wider px-2">All data is secure and tied to your account.</p>
                <div className="flex gap-2 pt-4">
                   <button onClick={() => setShowSyncModal(false)} className="flex-1 bg-surface-container border border-outline-variant rounded-xl py-4 text-xs font-bold font-headline">CLOSE</button>
                   <button onClick={logout} className="flex-1 bg-error/10 border border-error/20 text-error rounded-xl py-4 text-xs font-bold font-headline">LOGOUT</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
