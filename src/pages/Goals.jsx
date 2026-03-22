import { useState } from 'react'
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

function GoalCard({ goal, onUpdate, onRemove }) {
  const [editing, setEditing] = useState(false)
  const progress = pct(goal.current, goal.target)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={`bg-surface border rounded-2xl p-4 ${goal.isUltimate ? 'border-amber-400/40' : goal.isImmediate ? 'border-primary/40' : 'border-outline-variant'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          {!goal.isUltimate && !goal.isImmediate && (
            <span className="inline-block text-[9px] font-body font-bold text-success tracking-wider uppercase mb-1 bg-success/10 px-2 py-0.5 rounded-full">
              {goal.phase}
            </span>
          )}
          {goal.isImmediate && (
            <span className="inline-block text-[9px] font-body font-bold text-primary tracking-wider uppercase mb-1 bg-primary/10 px-2 py-0.5 rounded-full">
              Next Immediate Goal
            </span>
          )}
          {goal.isUltimate && (
            <span className="inline-block text-[9px] font-body font-bold text-amber-400 tracking-wider uppercase mb-1 bg-amber-400/10 px-2 py-0.5 rounded-full">
              The End in Mind
            </span>
          )}
          <h3 className="font-headline font-bold text-on-surface text-base">{goal.name}</h3>
          {goal.description && (
            <p className="text-gray-500 text-[11px] font-body mt-0.5 line-clamp-2">{goal.description}</p>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => setEditing(!editing)}
            className="text-gray-600 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>edit</span>
          </button>
          {!goal.isUltimate && (
            <button onClick={() => onRemove(goal.id)} className="text-gray-600 hover:text-error transition-colors">
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-body text-gray-500">
            {fmt(goal.current)} / {fmt(goal.target)}
          </span>
          <span className={`text-xs font-body font-bold ${progress >= 100 ? 'text-success' : progress >= 50 ? 'text-primary' : 'text-gray-400'}`}>
            {progress}%
          </span>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              goal.isUltimate ? 'bg-amber-400' :
              goal.isImmediate ? 'bg-primary' :
              progress >= 100 ? 'bg-success' : 'bg-secondary'
            }`}
          />
        </div>
      </div>

      {/* Edit Mode */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="border-t border-outline-variant pt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Current Amount</label>
                  <input
                    type="number"
                    value={goal.current}
                    onChange={e => onUpdate(goal.id, 'current', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-body text-on-surface outline-none focus:border-primary transition-colors mt-1"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Target Amount</label>
                  <input
                    type="number"
                    value={goal.target}
                    onChange={e => onUpdate(goal.id, 'target', e.target.value)}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-body text-on-surface outline-none focus:border-primary transition-colors mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Goal Name</label>
                <input
                  type="text"
                  value={goal.name}
                  onChange={e => onUpdate(goal.id, 'name', e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-body text-on-surface outline-none focus:border-primary transition-colors mt-1"
                />
              </div>
              <div>
                <label className="text-[9px] font-body text-gray-500 uppercase tracking-wider">Target Date</label>
                <input
                  type="date"
                  value={goal.deadline}
                  onChange={e => onUpdate(goal.id, 'deadline', e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-3 py-2 text-xs font-body text-on-surface outline-none focus:border-primary transition-colors mt-1"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goal.deadline && (
        <div className="flex items-center gap-1 mt-2">
          <span className="material-symbols-outlined text-gray-600" style={{ fontSize: '12px' }}>calendar_today</span>
          <span className="text-[10px] font-body text-gray-600">
            Target: {new Date(goal.deadline).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </span>
        </div>
      )}
    </motion.div>
  )
}

export default function Goals() {
  const { goals, updateGoal, addGoal, removeGoal, netWorth } = useApp()
  const [showAddModal, setShowAddModal] = useState(false)
  const [newGoal, setNewGoal] = useState({ name: '', target: '', current: '', deadline: '', phase: 'Custom', description: '' })

  const grouped = goals.reduce((acc, g) => {
    const key = g.phase || 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(g)
    return acc
  }, {})

  const handleAdd = () => {
    if (!newGoal.name || !newGoal.target) return
    addGoal({ ...newGoal, target: Number(newGoal.target), current: Number(newGoal.current) || 0 })
    setNewGoal({ name: '', target: '', current: '', deadline: '', phase: 'Custom', description: '' })
    setShowAddModal(false)
  }

  const totalGoalsValue = goals.filter(g => !g.isUltimate).reduce((s, g) => s + g.target, 0)
  const totalGoalsProgress = goals.filter(g => !g.isUltimate).reduce((s, g) => s + g.current, 0)
  const goalsComplete = goals.filter(g => !g.isUltimate && g.current >= g.target).length

  return (
    <div className="bg-background min-h-screen px-4 pt-5 pb-4">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="font-headline font-bold text-on-surface text-2xl">Wealth Goals</h1>
          <p className="text-gray-500 text-xs font-body mt-1">{goalsComplete} of {goals.filter(g => !g.isUltimate).length} goals complete</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 bg-primary text-background rounded-xl px-3 py-2 text-xs font-body font-bold hover:bg-primary/90 transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>add</span>
          Add Goal
        </button>
      </div>

      {/* Progress Overview */}
      <div className="bg-surface border border-outline-variant rounded-2xl p-4 mb-5">
        <div className="grid grid-cols-3 gap-3 text-center mb-3">
          <div>
            <p className="font-headline font-bold text-on-surface text-base">{goalsComplete}</p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider">Complete</p>
          </div>
          <div>
            <p className="font-headline font-bold text-primary text-base">{goals.filter(g => !g.isUltimate && g.current < g.target).length}</p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider">In Progress</p>
          </div>
          <div>
            <p className="font-headline font-bold text-on-surface text-base">${(netWorth / 1000).toFixed(0)}K</p>
            <p className="text-gray-500 text-[9px] font-body uppercase tracking-wider">Net Worth</p>
          </div>
        </div>
        <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${totalGoalsValue > 0 ? Math.min(100, (totalGoalsProgress / totalGoalsValue) * 100) : 0}%` }}
          />
        </div>
      </div>

      {/* Goals by Phase */}
      <div className="space-y-5">
        {Object.entries(grouped).map(([phase, phaseGoals]) => (
          <div key={phase}>
            <p className="text-[9px] font-body font-bold uppercase tracking-widest text-gray-600 mb-3 px-1">{phase}</p>
            <div className="space-y-3">
              <AnimatePresence>
                {phaseGoals.map(goal => (
                  <GoalCard key={goal.id} goal={goal} onUpdate={updateGoal} onRemove={removeGoal} />
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed inset-x-4 bottom-24 bg-surface border border-outline-variant rounded-3xl p-6 z-50 shadow-2xl"
            >
              <h2 className="font-headline font-bold text-on-surface text-lg mb-4">New Goal</h2>
              <div className="space-y-3">
                <input
                  placeholder="Goal name (e.g. Buy a Car)"
                  value={newGoal.name}
                  onChange={e => setNewGoal(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-body text-on-surface placeholder-gray-600 outline-none focus:border-primary transition-colors"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Target ($)"
                    value={newGoal.target}
                    onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-body text-on-surface placeholder-gray-600 outline-none focus:border-primary transition-colors"
                  />
                  <input
                    type="number"
                    placeholder="Current ($)"
                    value={newGoal.current}
                    onChange={e => setNewGoal(p => ({ ...p, current: e.target.value }))}
                    className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-body text-on-surface placeholder-gray-600 outline-none focus:border-primary transition-colors"
                  />
                </div>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={e => setNewGoal(p => ({ ...p, deadline: e.target.value }))}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-body text-on-surface outline-none focus:border-primary transition-colors"
                />
                <input
                  placeholder="Description (optional)"
                  value={newGoal.description}
                  onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))}
                  className="w-full bg-surface-container border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-body text-on-surface placeholder-gray-600 outline-none focus:border-primary transition-colors"
                />
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-outline-variant text-gray-400 text-sm font-body"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAdd}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-background text-sm font-body font-bold"
                >
                  Add Goal
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
