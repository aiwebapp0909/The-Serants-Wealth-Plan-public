import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

function pct(current, target) {
  if (!target || target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

function AddGoalModal({ onClose, onAdd }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [phase, setPhase] = useState('PHASE 1')
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleSubmit = () => {
    if (!name.trim() || !target || !deadline) return
    onAdd({
      name: name.trim(),
      target: Number(target) || 0,
      current: 0,
      phase,
      description: description.trim(),
      deadline,
      active: true,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl">
        <h2 className="font-headline font-bold text-on-surface text-xl mb-5">+ New Goal</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Goal Name *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Vacation Fund"
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Target Amount ($) *</label>
            <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. 5000"
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Deadline *</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phase</label>
            <select value={phase} onChange={(e) => setPhase(e.target.value)}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary">
              <option value="PHASE 1">Phase 1: Financial Stability</option>
              <option value="PHASE 2">Phase 2: Wealth Building</option>
              <option value="PHASE 3">Phase 3: Family + Assets</option>
              <option value="PHASE 4">Phase 4: Financial Freedom</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2}
              className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary resize-none" />
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <button onClick={onClose} className="flex-1 bg-surface-container border border-outline-variant rounded-xl py-3.5 text-xs font-bold font-headline">CANCEL</button>
          <button onClick={handleSubmit} disabled={!name.trim() || !target || !deadline}
            className="flex-1 bg-primary text-background rounded-xl py-3.5 text-xs font-bold font-headline disabled:opacity-40 hover:bg-primary/90 transition-colors">
            ADD GOAL
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function StartGoalModal({ goal, onClose, onStart }) {
  const [deadline, setDeadline] = useState('')

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-surface border border-outline-variant rounded-3xl p-6 shadow-2xl">
        <h2 className="font-headline font-bold text-on-surface text-lg mb-2">Start Working On Goal</h2>
        <p className="text-sm font-body text-gray-400 mb-4">Set a deadline for <span className="text-primary font-bold">{goal.name}</span></p>
        <div className="bg-surface-container rounded-2xl p-4 border border-outline-variant mb-4">
          <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest mb-1">Target</p>
          <p className="font-headline font-bold text-on-surface text-xl">{fmt(goal.target)}</p>
          <p className="text-xs text-gray-500 mt-1">{goal.description || 'No description'}</p>
        </div>
        <div className="mb-6">
          <label className="block text-[10px] font-body font-bold text-gray-500 uppercase tracking-widest mb-1.5">Achieve By *</label>
          <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)}
            className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary" />
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-surface-container border border-outline-variant rounded-xl py-3.5 text-xs font-bold font-headline">CANCEL</button>
          <button onClick={() => { onStart(goal.id, deadline); onClose(); }} disabled={!deadline}
            className="flex-1 bg-primary text-background rounded-xl py-3.5 text-xs font-bold font-headline disabled:opacity-40 hover:bg-primary/90 transition-colors flex items-center justify-center gap-1.5">
            <span className="material-symbols-outlined text-sm">rocket_launch</span> START
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function Goals() {
  const { goals, updateGoal, addGoal, startGoal, stopGoal } = useApp()
  const [showAddGoal, setShowAddGoal] = useState(false)
  const [startingGoal, setStartingGoal] = useState(null)

  const activeGoals = useMemo(() => goals.filter(g => g.active && g.deadline && g.current < g.target), [goals])
  const completedGoals = useMemo(() => goals.filter(g => g.current >= g.target && !g.isUltimate), [goals])
  const inactiveGoals = useMemo(() => goals.filter(g => !g.active && g.current < g.target && !g.isUltimate), [goals])

  const stats = useMemo(() => {
    const all = goals.filter(g => !g.isUltimate)
    const totalGoals = activeGoals.length
    const totalSaved = activeGoals.reduce((s, g) => s + (g.current || 0), 0)
    const combinedTarget = activeGoals.reduce((s, g) => s + (g.target || 0), 0)
    const onTrack = activeGoals.filter(g => {
      if (!g.deadline) return true
      const deadline = new Date(g.deadline)
      return deadline >= new Date()
    }).length
    const behind = activeGoals.length - onTrack
    return { totalGoals, totalSaved, combinedTarget, onTrack, behind }
  }, [activeGoals, goals])

  // Chart data for active goals
  const chartData = useMemo(() => {
    return activeGoals.map(g => ({
      name: g.name.length > 12 ? g.name.slice(0, 12) + '...' : g.name,
      Target: g.target,
      Saved: g.current,
    }))
  }, [activeGoals])

  const onTrackGoals = useMemo(() => activeGoals.filter(g => {
    if (!g.deadline) return true
    return new Date(g.deadline) >= new Date()
  }), [activeGoals])

  const behindGoals = useMemo(() => activeGoals.filter(g => {
    if (!g.deadline) return false
    return new Date(g.deadline) < new Date() && g.current < g.target
  }), [activeGoals])

  const handleToggle = (id, newValue) => {
    updateGoal(id, 'current', newValue)
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-surface border border-outline-variant rounded-xl p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs font-body font-bold" style={{ color: p.fill }}>
            {p.name}: {fmt(p.value)}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-headline font-bold text-on-surface text-2xl">Goals</h1>
            <p className="text-gray-500 text-xs font-body mt-0.5">Track your savings goals and progress</p>
          </div>
          <button
            onClick={() => setShowAddGoal(true)}
            className="flex items-center gap-1.5 bg-primary text-background px-4 py-2.5 rounded-xl font-body font-bold text-sm hover:bg-primary/90 transition-colors active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            New Goal
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* 4 STAT CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-gray-500 text-sm">target</span>
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold">Total Goals</p>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-3xl">{stats.totalGoals}</h2>
          </div>
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-gray-500 text-sm">trending_up</span>
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold">Total Saved</p>
            </div>
            <h2 className="font-headline font-bold text-primary text-3xl">{fmt(stats.totalSaved)}</h2>
          </div>
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-gray-500 text-sm">calendar_month</span>
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold">Combined Target</p>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-3xl">{fmt(stats.combinedTarget)}</h2>
          </div>
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-gray-500 text-sm">check_circle</span>
              <p className="text-[10px] font-body text-gray-500 uppercase tracking-widest font-bold">On Track / Behind</p>
            </div>
            <h2 className="font-headline font-bold text-3xl">
              <span className="text-success">{stats.onTrack}</span>
              <span className="text-gray-600"> / </span>
              <span className="text-error">{stats.behind}</span>
            </h2>
          </div>
        </div>

        {/* ACTIVE GOALS - Cards */}
        {activeGoals.length > 0 && (
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <h3 className="font-headline font-bold text-on-surface text-lg mb-4">Active Goals</h3>
            <div className="space-y-3">
              {activeGoals.map(goal => {
                const progress = pct(goal.current, goal.target)
                const deadline = goal.deadline ? new Date(goal.deadline) : null
                const daysLeft = deadline ? Math.max(0, Math.ceil((deadline - new Date()) / (1000 * 60 * 60 * 24))) : null
                const isBehind = deadline && deadline < new Date() && goal.current < goal.target

                return (
                  <div key={goal.id} className="bg-surface-container rounded-xl p-4 border border-outline-variant/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-headline font-bold text-on-surface truncate">{goal.name}</p>
                        {goal.description && <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{goal.description}</p>}
                      </div>
                      <p className="text-xs font-body text-gray-400 flex-shrink-0 ml-2">{fmt(goal.current)} / {fmt(goal.target)}</p>
                    </div>
                    <div className="h-2 bg-surface-container-high rounded-full overflow-hidden mb-2">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className={`h-full rounded-full ${isBehind ? 'bg-error' : 'bg-primary'}`} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {deadline && (
                          <span className={`text-[9px] font-body flex items-center gap-1 ${isBehind ? 'text-error' : 'text-gray-500'}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '10px' }}>schedule</span>
                            {isBehind ? 'Overdue' : `${daysLeft} days left`}
                          </span>
                        )}
                      </div>
                      <span className={`text-[10px] font-body font-bold ${isBehind ? 'text-error' : 'text-primary'}`}>{progress}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SAVED VS TARGET CHART */}
        {chartData.length > 0 && (
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <h3 className="font-headline font-bold text-on-surface text-lg mb-4">Saved vs Target by Goal</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333340" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Target" fill="#333340" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saved" fill="#00E676" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ON TRACK / BEHIND SCHEDULE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <h4 className="font-headline font-bold text-success text-sm mb-3">On Track</h4>
            {onTrackGoals.length > 0 ? (
              <div className="space-y-2">
                {onTrackGoals.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-1">
                    <p className="text-sm font-body text-on-surface">{g.name}</p>
                    <p className="text-sm font-body font-bold text-success">{pct(g.current, g.target)}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs font-body">No on-track goals</p>
            )}
          </div>
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <h4 className="font-headline font-bold text-error text-sm mb-3">Behind Schedule</h4>
            {behindGoals.length > 0 ? (
              <div className="space-y-2">
                {behindGoals.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-1">
                    <p className="text-sm font-body text-on-surface">{g.name}</p>
                    <p className="text-sm font-body font-bold text-error">{pct(g.current, g.target)}%</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs font-body">All goals are on track!</p>
            )}
          </div>
        </div>

        {/* AVAILABLE GOALS (not yet started) */}
        {inactiveGoals.length > 0 && (
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <h3 className="font-headline font-bold text-on-surface text-lg mb-1">Available Goals</h3>
            <p className="text-[10px] font-body text-gray-500 mb-4">Click "Start" to set a deadline and begin tracking</p>
            <div className="space-y-2">
              {inactiveGoals.map(goal => (
                <div key={goal.id} className="flex items-center justify-between py-3 px-4 bg-surface-container rounded-xl border border-outline-variant/50 group hover:border-primary/30 transition-colors">
                  <div className="flex-1 min-w-0 mr-3">
                    <p className="text-sm font-headline font-bold text-on-surface truncate">{goal.name}</p>
                    {goal.description && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{goal.description}</p>}
                    <p className="text-[10px] text-gray-500 mt-0.5">Target: {fmt(goal.target)}</p>
                  </div>
                  <button
                    onClick={() => setStartingGoal(goal)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-lg text-primary text-xs font-bold hover:bg-primary/20 transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-sm">rocket_launch</span>
                    Start
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* COMPLETED GOALS */}
        {completedGoals.length > 0 && (
          <div className="bg-surface border border-outline-variant rounded-2xl p-4">
            <h3 className="font-headline font-bold text-on-surface text-lg mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-success">check_circle</span>
              Completed ({completedGoals.length})
            </h3>
            <div className="space-y-2">
              {completedGoals.map(g => (
                <div key={g.id} className="flex items-center justify-between py-2 px-3 bg-success/5 rounded-xl border border-success/20">
                  <p className="text-sm font-body text-gray-400 line-through">{g.name}</p>
                  <p className="text-xs font-body font-bold text-success">{fmt(g.target)} ✓</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showAddGoal && <AddGoalModal onClose={() => setShowAddGoal(false)} onAdd={addGoal} />}
        {startingGoal && <StartGoalModal goal={startingGoal} onClose={() => setStartingGoal(null)} onStart={startGoal} />}
      </AnimatePresence>
    </div>
  )
}
