import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function pct(current, target) {
  if (!target || target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function GoalCheckpoint({ goal, onUpdate, onRemove, status }) {
  const [editing, setEditing] = useState(false)
  const progress = pct(goal.current, goal.target)

  const getStatusIcon = () => {
    if (progress >= 100) return 'check_circle'
    if (status === 'locked') return 'lock'
    return 'pending'
  }

  const getStatusColor = () => {
    if (progress >= 100) return 'text-success'
    if (status === 'locked') return 'text-gray-600'
    return 'text-primary'
  }

  return (
    <div className={`min-w-[280px] snap-center p-1`}>
      <motion.div
        layout
        className={`bg-surface border rounded-3xl p-5 h-full flex flex-col justify-between ${
          status === 'locked' ? 'opacity-60 grayscale' : 'shadow-lg shadow-black/5'
        } ${progress >= 100 ? 'border-success/40' : 'border-outline-variant'}`}
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className={`material-symbols-outlined ${getStatusColor()}`}>{getStatusIcon()}</span>
            <div className="flex gap-2">
              <button onClick={() => setEditing(!editing)} className="text-gray-500 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm">edit</span>
              </button>
              {!goal.isUltimate && (
                <button onClick={() => onRemove(goal.id)} className="text-gray-500 hover:text-error transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
          </div>
          
          <h3 className="font-headline font-bold text-on-surface text-base mb-1">{goal.name}</h3>
          <p className="text-gray-600 text-[11px] font-body line-clamp-3 mb-4">{goal.description}</p>
        </div>

        <div>
          <div className="flex justify-between items-end mb-1.5">
            <div className="text-[10px] font-body text-gray-400 uppercase tracking-widest">Progress</div>
            <div className={`text-xs font-headline font-bold ${progress >= 100 ? 'text-success' : 'text-primary'}`}>{progress}%</div>
          </div>
          <div className="h-1.5 bg-surface-container-high rounded-full overflow-hidden mb-3">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${progress >= 100 ? 'bg-success' : 'bg-primary'}`}
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-body text-on-surface font-semibold">{fmt(goal.current)}</span>
            <span className="text-[10px] font-body text-gray-500">Target: {fmt(goal.target)}</span>
          </div>
        </div>

        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 border-t border-outline-variant pt-4 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-body text-gray-500 uppercase">Current</label>
                  <input
                    type="number"
                    value={goal.current}
                    onChange={e => onUpdate(goal.id, 'current', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-2 py-1.5 text-xs font-body text-on-surface outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-body text-gray-500 uppercase">Target</label>
                  <input
                    type="number"
                    value={goal.target}
                    onChange={e => onUpdate(goal.id, 'target', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-2 py-1.5 text-xs font-body text-on-surface outline-none"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

export default function Goals() {
  const { goals, updateGoal, addGoal, removeGoal, netWorth } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '', deadline: '', phase: '🟢 PHASE 1: FINANCIAL STABILITY', description: '' })
  
  const timelineRef = useRef(null)

  const phases = useMemo(() => {
    const grouped = goals.reduce((acc, g) => {
      const key = g.phase || 'Custom'
      if (!acc[key]) acc[key] = { name: key, goals: [], progress: 0 }
      acc[key].goals.push(g)
      return acc
    }, {})

    return Object.values(grouped).map(p => {
      const totalProgress = p.goals.reduce((sum, g) => sum + pct(g.current, g.target), 0)
      p.progress = Math.round(totalProgress / p.goals.length)
      return p
    }).sort((a,b) => a.name.localeCompare(b.name))
  }, [goals])

  const wealthScore = useMemo(() => {
    const totalGoals = goals.filter(g => !g.isUltimate)
    if (totalGoals.length === 0) return 0
    const overallProgress = totalGoals.reduce((sum, g) => sum + pct(g.current, g.target), 0)
    return Math.round(overallProgress / totalGoals.length)
  }, [goals])

  const handleAdd = () => {
    if (!newGoal.name || !newGoal.target) return
    addGoal({ ...newGoal, target: Number(newGoal.target), current: Number(newGoal.current) || 0 })
    setShowAddModal(false)
  }

  return (
    <div className="bg-background min-h-screen px-4 pt-6 pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-3xl">Wealth Plan</h1>
          <p className="text-gray-500 text-xs font-body mt-1">Journey to $20,000,000 Net Worth</p>
        </div>
        <div className="text-right">
          <p className="font-headline font-bold text-primary text-3xl">{wealthScore}%</p>
          <p className="text-[9px] font-body text-gray-500 uppercase tracking-widest font-bold">Plan Score</p>
        </div>
      </div>

      {/* Main Roadmap */}
      <div className="space-y-12">
        {phases.map((phase, pIndex) => {
          const prevPhaseComplete = pIndex === 0 || phases[pIndex-1].progress >= 100
          
          return (
            <div key={phase.name} className="relative">
              {/* Phase Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <h2 className="font-headline font-semibold text-on-surface text-sm uppercase tracking-wider">{phase.name}</h2>
                  <p className="text-[10px] font-body text-gray-500 mt-0.5">
                    {phase.progress >= 100 ? '✅ PHASE COMPLETE' : phase.progress > 0 ? '🚀 IN PROGRESS' : '🔒 LOCKED'}
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-headline font-bold ${phase.progress >= 100 ? 'text-success' : 'text-primary'}`}>
                    {phase.progress}%
                  </span>
                </div>
              </div>

              {/* Horizontal Scrollable Goals */}
              <div 
                className="flex overflow-x-auto gap-4 pb-4 px-1 snap-x no-scrollbar"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {phase.goals.sort((a,b) => a.id.localeCompare(b.id)).map((goal, gIndex) => {
                  const isLocked = !prevPhaseComplete && phase.progress === 0
                  return (
                    <GoalCheckpoint 
                      key={goal.id} 
                      goal={goal} 
                      onUpdate={updateGoal} 
                      onRemove={removeGoal}
                      status={isLocked ? 'locked' : 'available'}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-24 right-4 z-40">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-14 h-14 rounded-full bg-primary text-background flex items-center justify-center shadow-xl shadow-primary/30 active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </button>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] bg-surface border border-outline-variant rounded-3xl p-6 z-50 shadow-2xl overflow-hidden">
              <h2 className="font-headline font-bold text-on-surface text-xl mb-6">Create Custom Goal</h2>
              <div className="space-y-4">
                <input placeholder="Goal name" className="w-full bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-sm" value={newGoal.name} onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Target ($)" className="w-full bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-sm" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))} />
                  <input type="number" placeholder="Current ($)" className="w-full bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-sm" value={newGoal.current} onChange={e => setNewGoal(p => ({ ...p, current: e.target.value }))} />
                </div>
                <select className="w-full bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-sm text-on-surface appearance-none" value={newGoal.phase} onChange={e => setNewGoal(p => ({ ...p, phase: e.target.value }))}>
                  <option>🟢 PHASE 1: FINANCIAL STABILITY</option>
                  <option>🔵 PHASE 2: WEALTH BUILDING</option>
                  <option>🟣 PHASE 3: FAMILY + ASSETS</option>
                  <option>🔴 PHASE 5: FINANCIAL FREEDOM</option>
                </select>
                <textarea placeholder="Description" rows={3} className="w-full bg-surface-container border border-outline-variant rounded-2xl px-4 py-3 text-sm" value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="flex gap-3 mt-8">
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 text-gray-500 font-bold">Cancel</button>
                <button onClick={handleAdd} className="flex-1 py-3 bg-primary text-background rounded-2xl font-bold">Create Goal</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
