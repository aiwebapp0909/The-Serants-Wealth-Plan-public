import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { useAI } from '../hooks/useAI'
import { useState, useEffect, useMemo } from 'react'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

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
    healthScore, goals, unassigned
  } = useApp()
  
  const { createHousehold, joinHousehold, userProfile, user, logout } = useAuth()
  const { insight, loading: aiLoading, generateInsight } = useAI()
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [householdIdInput, setHouseholdIdInput] = useState('')
  const [passcodeInput, setPasscodeInput] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (userProfile && !insight && !aiLoading) {
      generateInsight({
        netWorth: Math.abs(netWorth),
        income: totalIncome,
        expenses: totalExpenses,
        savings: totalSavings + totalInvesting,
        healthScore,
        nextGoal: nextImmediateGoal?.name || 'Emergency Fund'
      })
    }
  }, [userProfile, netWorth, totalIncome, totalExpenses, healthScore, nextImmediateGoal])

  const handleCreate = async () => {
    if (!passcodeInput.trim()) return
    try {
      await createHousehold(passcodeInput)
      setShowSyncModal(false)
    } catch (e) { setError(e.message) }
  }

  const handleJoin = async () => {
    if (!householdIdInput.trim() || !passcodeInput.trim()) return
    try {
      await joinHousehold(householdIdInput.trim(), passcodeInput)
      setShowSyncModal(false)
    } catch (e) { setError(e.message) }
  }

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
            className={`flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-body font-bold transition-all ${userProfile?.householdId ? 'bg-success/10 border-success/40 text-success' : 'bg-surface-container border-outline-variant text-on-surface hover:border-primary/50'}`}
          >
            <span className={userProfile?.householdId ? 'text-success' : 'text-primary'}>⚡</span>
            {userProfile?.householdId ? 'Synced' : 'Couple Sync'}
          </button>
        </div>
      </div>

      <div className="px-4 space-y-3 pb-24">
        {/* ROW 1: GOALS GRID */}
        <div className="grid grid-cols-2 gap-3">
          {/* Next Immediate Goal */}
          <Link to="/goals">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between relative overflow-hidden active:scale-[0.98] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest">Next Immediate Goal</span>
                  <span className="material-symbols-outlined text-gray-600 text-[16px]">my_location</span>
                </div>
                <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
                  {nextImmediateGoal?.name || 'Set a Goal'}
                </h3>
                <p className="text-gray-500 text-[10px] font-body mt-1">
                  {nextImmediateGoal ? `${fmt(nextImmediateGoal.current)} / ${fmt(nextImmediateGoal.target)}` : 'No active goal'}
                </p>
              </div>
              <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct(nextImmediateGoal?.current, nextImmediateGoal?.target)}%` }} className="h-full bg-primary rounded-full" />
              </div>
            </div>
          </Link>

          {/* Next Goal */}
          <Link to="/goals">
            <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between active:scale-[0.98] transition-all">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest">Next Goal</span>
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
              {nextGoal && (
                <div className="h-1 bg-surface-container-high rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${pct(nextGoal.current, nextGoal.target)}%` }} className="h-full bg-secondary rounded-full" />
                </div>
              )}
            </div>
          </Link>
        </div>

        {/* ROW 2: LEFT TO PLAN + HEALTH GRID */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left to Plan */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between">
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
                <span className="text-gray-500 uppercase font-bold tracking-widest">Net Worth</span>
                <span className="text-on-surface/60">{fmt(netWorth)}</span>
              </div>
            </div>
          </div>

          {/* Health Score */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-4 h-36 flex flex-col justify-between relative">
             <div className="absolute top-4 right-4 text-[8px] font-body font-bold text-amber-500 uppercase tracking-widest border border-amber-500/30 px-1.5 py-0.5 rounded">
               {healthScore >= 70 ? 'Excellent' : 'Good'}
             </div>
             <div>
                <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-2">Health Score</p>
                <h2 className="font-headline font-bold text-on-surface text-4xl">{healthScore}</h2>
             </div>
             <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${healthScore}%` }} className={`h-full rounded-full ${healthScore >= 70 ? 'bg-success' : 'bg-amber-500'}`} />
             </div>
          </div>
        </div>

        {/* ROW 3: ULTIMATE GOAL (FULL WIDTH) */}
        <div className="bg-surface border border-outline-variant rounded-2xl p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-5 opacity-10">
              <span className="material-symbols-outlined text-6xl">stars</span>
           </div>
           <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest mb-3">Ultimate Goal</p>
           <div className="flex items-end justify-between mb-4">
              <div>
                 <h2 className="font-headline font-bold text-on-surface text-4xl">{ultimateGoal ? fmt(ultimateGoal.target) : '$20.0M'}</h2>
                 <p className="text-gray-500 text-[10px] font-body uppercase tracking-widest mt-1">The End In Mind</p>
              </div>
              <div className="text-right">
                 <p className="font-headline font-bold text-on-surface/80 text-xl">{pct(netWorth, ultimateGoal?.target)}%</p>
                 <p className="text-[8px] font-body font-bold text-gray-500 uppercase tracking-widest">Complete</p>
              </div>
           </div>
           <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct(netWorth, ultimateGoal?.target)}%` }} className="h-full bg-primary/40 rounded-full" />
           </div>
        </div>

        {/* ROW 4: AI FINANCIAL COACH */}
        <div className="bg-surface-container border border-outline-variant rounded-2xl p-4 flex gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-primary text-xl">psychology</span>
          </div>
          <div className="flex-1">
             <div className="flex items-center justify-between mb-1">
                <p className="text-[9px] font-body font-bold text-primary uppercase tracking-widest">AI Financial Coach</p>
                {aiLoading && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
             </div>
             {aiLoading ? (
               <div className="h-3 bg-surface-container-high w-3/4 animate-pulse rounded" />
             ) : (
               <p className="text-xs font-body text-on-surface/80 italic leading-relaxed">"{insight || 'Analyzing your path to freedom...'}"</p>
             )}
          </div>
        </div>
        
        {/* NEW: ZERO-BASED STATUS INDICATOR (Mini) */}
        <div className={`p-3 rounded-2xl flex items-center justify-between border ${unassigned === 0 ? 'bg-success/5 border-success/20 text-success' : 'bg-primary/5 border-primary/20 text-primary'}`}>
           <span className="text-[9px] font-body font-bold uppercase tracking-widest">Budget Status</span>
           <span className="text-[10px] font-headline font-bold">{unassigned === 0 ? 'FULLY ALLOCATED ✅' : `${fmt(unassigned)} LEFT TO ASSIGN`}</span>
        </div>
      </div>

      {/* SYNC MODAL */}
      <AnimatePresence>
        {showSyncModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setShowSyncModal(false); setError(''); }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl">
              <h2 className="font-headline font-bold text-on-surface text-xl mb-4 text-center">Household Access</h2>
              
              {userProfile?.householdId ? (
                <div className="text-center space-y-4">
                  <div className="bg-surface-container p-4 rounded-2xl border border-outline-variant">
                    <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest mb-1">Household ID</p>
                    <p className="font-headline font-bold text-primary text-lg">{userProfile.householdId}</p>
                  </div>
                  <p className="text-xs font-body text-gray-500 px-4">Share this ID and your Secret Passcode with your partner to sync data.</p>
                  <button onClick={() => setShowSyncModal(false)} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 text-sm font-bold">CLOSE</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex bg-surface-container rounded-xl p-1">
                    <button onClick={() => setIsCreating(false)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isCreating ? 'bg-surface shadow-sm text-primary' : 'text-gray-500'}`}>JOIN</button>
                    <button onClick={() => setIsCreating(true)} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isCreating ? 'bg-surface shadow-sm text-primary' : 'text-gray-500'}`}>NEW HOUSE</button>
                  </div>

                  {error && <p className="text-[10px] font-body font-bold text-error uppercase text-center">{error}</p>}

                  <div className="space-y-4">
                    { !isCreating && (
                      <input type="text" placeholder="Household ID (e.g. H-A1B2C3)" value={householdIdInput} onChange={(e) => setHouseholdIdInput(e.target.value.toUpperCase())} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm outline-none focus:border-primary text-center uppercase tracking-widest" />
                    )}
                    <input type="password" placeholder="Passcode (4-6 digits)" value={passcodeInput} onChange={(e) => setPasscodeInput(e.target.value)} className="w-full bg-surface-container border border-outline-variant rounded-xl py-3 px-4 text-sm outline-none focus:border-primary text-center tracking-[1em]" maxLength={6} />
                    
                    <button 
                      onClick={isCreating ? handleCreate : handleJoin} 
                      className="w-full bg-primary text-background rounded-xl py-3 text-sm font-bold shadow-lg shadow-primary/20"
                    >
                      {isCreating ? 'CREATE HOUSEHOLD' : 'LINK HOUSEHOLD'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
