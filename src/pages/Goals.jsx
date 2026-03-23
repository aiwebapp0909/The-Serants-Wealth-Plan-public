import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../context/AppContext'

function pct(current, target) {
  if (!target || target === 0) return 0
  return Math.min(100, Math.round((current / target) * 100))
}

function fmt(n) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

const PHASE_META = {
  1: { label: 'FOUNDATION',   color: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/60',  dot: 'bg-emerald-500', icon: 'savings' },
  2: { label: 'ACCELERATION', color: 'text-amber-400',   border: 'border-amber-500/40',   bg: 'bg-amber-950/60',   dot: 'bg-amber-500',   icon: 'trending_up' },
  3: { label: 'ACCUMULATION', color: 'text-blue-400',    border: 'border-blue-500/40',    bg: 'bg-blue-950/60',    dot: 'bg-blue-500',    icon: 'home' },
  4: { label: 'LIBERATION',   color: 'text-red-400',     border: 'border-red-500/40',     bg: 'bg-red-950/60',     dot: 'bg-red-500',     icon: 'flag' },
}

const PHASE_NAMES = ['Financial Stability', 'Wealth Building', 'Family + Assets', 'Financial Freedom']

function GoalRow({ goal, onToggle }) {
  const done = goal.current >= goal.target
  const progress = pct(goal.current, goal.target)

  return (
    <button
      onClick={() => onToggle(goal.id, done ? 0 : goal.target)}
      className="w-full flex items-start gap-3 p-3 rounded-2xl bg-black/20 hover:bg-black/30 active:scale-[0.99] transition-all text-left group"
    >
      <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${done ? 'bg-primary border-primary' : 'border-gray-600 group-hover:border-gray-400'}`}>
        {done && <span className="material-symbols-outlined text-background font-bold" style={{ fontSize: '12px' }}>check</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-headline font-bold truncate transition-colors ${done ? 'line-through text-gray-500' : 'text-on-surface'}`}>
          {goal.name}
        </p>
        {goal.description && (
          <p className="text-[11px] font-body text-gray-500 mt-0.5 leading-snug line-clamp-2">{goal.description}</p>
        )}
        {!done && goal.target > 1 && (
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[9px] font-body text-gray-600">{fmt(goal.current)} / {fmt(goal.target)}</span>
          </div>
        )}
      </div>
    </button>
  )
}

function PhaseCard({ phaseNum, goals, onToggle, index }) {
  const meta = PHASE_META[phaseNum]
  const completedCount = goals.filter(g => g.current >= g.target).length
  const progress = goals.length > 0 ? Math.round((completedCount / goals.length) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`border-2 ${meta.border} ${meta.bg} rounded-[28px] overflow-hidden flex-shrink-0 w-[82vw] max-w-[360px] snap-center`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className={`text-[9px] font-body font-bold uppercase tracking-[0.2em] ${meta.color} mb-1`}>{meta.label}</p>
          <h3 className="font-headline font-bold text-on-surface text-lg leading-tight">
            Phase {phaseNum}: {PHASE_NAMES[phaseNum - 1]}
          </h3>
        </div>
        <div className={`px-3 py-1.5 rounded-full text-[10px] font-body font-bold ${progress >= 100 ? 'bg-success/20 text-success' : 'bg-white/5 text-gray-400'}`}>
          {progress}%
        </div>
      </div>

      {/* Goals */}
      <div className="px-3 pb-4 space-y-2">
        {goals.map(goal => (
          <GoalRow key={goal.id} goal={goal} onToggle={onToggle} />
        ))}
        {goals.length === 0 && (
          <p className="text-center text-gray-600 text-xs font-body py-4 italic">No goals for this phase yet.</p>
        )}
      </div>
    </motion.div>
  )
}

export default function Goals() {
  const { goals, updateGoal } = useApp()

  const phases = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [] }
    goals.forEach(g => {
      const match = (g.phase || '').match(/(\d+)/)
      const num = match ? Math.min(4, Math.max(1, parseInt(match[1]))) : 1
      grouped[num].push(g)
    })
    return grouped
  }, [goals])

  const overallProgress = useMemo(() => {
    const all = goals.filter(g => !g.isUltimate)
    if (!all.length) return 0
    return Math.round(all.reduce((s, g) => s + pct(g.current, g.target), 0) / all.length)
  }, [goals])

  const handleToggle = (id, newValue) => {
    updateGoal(id, 'current', newValue)
  }

  return (
    <div className="bg-background min-h-screen pt-6 pb-32">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 px-5">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-3xl">Wealth Roadmap</h1>
          <p className="text-gray-500 text-xs font-body mt-1.5">Click any goal to update progress.<br/>All changes save automatically.</p>
        </div>
        {/* Progress Ring */}
        <div className="relative w-16 h-16 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5" className="text-surface-container" />
            <motion.circle
              cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="5"
              className="text-primary"
              strokeDasharray="163.4"
              initial={{ strokeDashoffset: 163.4 }}
              animate={{ strokeDashoffset: 163.4 - (163.4 * overallProgress) / 100 }}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-headline font-bold text-on-surface text-xs">{overallProgress}%</span>
        </div>
      </div>

      {/* Phase Cards — horizontal scroll, 2 visible at a time */}
      <div
        className="flex gap-4 px-5 overflow-x-auto snap-x snap-mandatory pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {[1, 2, 3, 4].map((n, i) => (
          <PhaseCard key={n} phaseNum={n} goals={phases[n]} onToggle={handleToggle} index={i} />
        ))}
      </div>

      {/* Phase dots */}
      <div className="flex justify-center gap-2 mt-2">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`w-1.5 h-1.5 rounded-full ${PHASE_META[n].dot} opacity-70`} />
        ))}
      </div>
    </div>
  )
}
