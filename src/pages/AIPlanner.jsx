import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIStrategist } from '../hooks/useAIStrategist'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

export default function AIPlanner() {
  const {
    budget, goals, netWorth, totalIncome, totalExpenses,
    totalSavings, totalInvesting, healthScore, executeAIActions,
  } = useApp()
  const { user } = useAuth()
  const { messages, loading, pendingActions, lastPlan, sendMessage, clearHistory, clearActions } = useAIStrategist()
  const [input, setInput] = useState('')
  const [showActions, setShowActions] = useState(false)
  const [executionResult, setExecutionResult] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Build financial data context for AI
  const financialData = useMemo(() => ({
    budget: {
      income: budget.income?.map(i => ({ name: i.name, planned: Math.abs(i.planned), actual: Math.abs(i.actual) })),
      fixedBills: budget.fixedBills?.map(i => ({ name: i.name, planned: Math.abs(i.planned), actual: Math.abs(i.actual) })),
      food: budget.food?.map(i => ({ name: i.name, planned: Math.abs(i.planned), actual: Math.abs(i.actual) })),
      savings: budget.savings?.map(i => ({ name: i.name, planned: Math.abs(i.planned), actual: Math.abs(i.actual) })),
      investing: budget.investing?.map(i => ({ name: i.name, planned: Math.abs(i.planned), actual: Math.abs(i.actual) })),
      funMoney: budget.funMoney?.map(i => ({ name: i.name, planned: Math.abs(i.planned), actual: Math.abs(i.actual) })),
    },
    goals: goals.map(g => ({ name: g.name, target: g.target, current: g.current, phase: g.phase })),
    netWorth,
    totalIncome,
    totalExpenses: Math.abs(totalExpenses),
    totalSavings,
    totalInvesting,
    healthScore,
  }), [budget, goals, netWorth, totalIncome, totalExpenses, totalSavings, totalInvesting, healthScore])

  const handleSend = async () => {
    if (!input.trim() || loading) return
    setExecutionResult(null)
    await sendMessage(input, financialData)
    setInput('')
  }

  const handleApplyPlan = () => {
    if (!pendingActions.length) return
    const result = executeAIActions(pendingActions)
    setExecutionResult(result)
    clearActions()
    setShowActions(false)
  }

  const quickPrompts = [
    "Create my April 2026 budget",
    "How can I save more money?",
    "Generate a weekly execution plan",
    "Optimize my spending categories",
    "How do I reach my emergency fund goal faster?",
  ]

  return (
    <div className="bg-background min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-outline-variant">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-xl">psychology</span>
            </div>
            <div>
              <h1 className="font-headline font-bold text-on-surface text-lg">AI Strategist</h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold">Financial Intelligence Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingActions.length > 0 && (
              <button
                onClick={() => setShowActions(true)}
                className="relative flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary text-xs font-bold animate-pulse"
              >
                <span className="material-symbols-outlined text-sm">bolt</span>
                {pendingActions.length} Actions
              </button>
            )}
            {messages.length > 0 && (
              <button
                onClick={clearHistory}
                className="text-gray-500 hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-lg">delete_sweep</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center pt-12">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-primary text-4xl">auto_awesome</span>
            </div>
            <h2 className="font-headline font-bold text-on-surface text-xl mb-2">Your AI Financial Strategist</h2>
            <p className="text-gray-500 text-sm font-body mb-8 max-w-xs">
              Ask me to create budgets, optimize spending, build wealth plans, and execute changes automatically.
            </p>

            {/* Quick Prompts */}
            <div className="w-full max-w-md space-y-2">
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-3">Try asking</p>
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); }}
                  className="w-full text-left bg-surface border border-outline-variant rounded-2xl px-4 py-3 text-sm font-body text-on-surface/80 hover:border-primary/50 hover:bg-primary/5 transition-all active:scale-[0.98]"
                >
                  <span className="text-primary mr-2">→</span> {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm font-body ${
                msg.role === 'user'
                  ? 'bg-primary text-background rounded-br-md'
                  : msg.role === 'system'
                  ? 'bg-error/10 text-error border border-error/20'
                  : 'bg-surface border border-outline-variant text-on-surface rounded-bl-md'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                    {msg.hasActions && (
                      <div className="mt-3 pt-3 border-t border-outline-variant/50">
                        <div className="flex items-center gap-2 text-primary text-xs font-bold">
                          <span className="material-symbols-outlined text-sm">bolt</span>
                          Actions are ready to apply
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </motion.div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-surface border border-outline-variant rounded-2xl px-4 py-3 rounded-bl-md">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-gray-500 ml-2">Strategizing...</span>
              </div>
            </div>
          </div>
        )}

        {/* Execution Result */}
        {executionResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-success/10 border border-success/30 rounded-2xl p-4"
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-success">check_circle</span>
              <p className="font-headline font-bold text-success text-sm">Plan Applied!</p>
            </div>
            <p className="text-xs text-gray-400 font-body">
              {executionResult.success} actions executed successfully
              {executionResult.failed > 0 && `, ${executionResult.failed} failed`}
            </p>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-outline-variant p-4 pb-24">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ask your strategist anything..."
            disabled={loading}
            className="flex-1 bg-surface border border-outline-variant rounded-2xl px-4 py-3 text-sm font-body text-on-surface placeholder-gray-500 outline-none focus:border-primary transition-colors"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="w-12 h-12 bg-primary hover:bg-primary/90 disabled:opacity-40 text-background rounded-2xl flex items-center justify-center transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </div>

      {/* Actions Panel Modal */}
      <AnimatePresence>
        {showActions && pendingActions.length > 0 && (
          <div className="fixed inset-0 z-[200] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowActions(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full max-w-lg bg-surface border-t border-outline-variant rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden flex flex-col"
            >
              {/* Panel Header */}
              <div className="px-6 pt-6 pb-4 border-b border-outline-variant">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-headline font-bold text-on-surface text-lg">AI Actions</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{pendingActions.length} changes ready to apply</p>
                  </div>
                  <button onClick={() => setShowActions(false)} className="text-gray-400 hover:text-on-surface">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Actions List */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                {pendingActions.map((action, i) => (
                  <div key={i} className="bg-surface-container rounded-xl p-4 border border-outline-variant/50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`material-symbols-outlined text-sm ${
                        action.type === 'UPDATE_CATEGORY' ? 'text-primary' :
                        action.type === 'CREATE_CATEGORY' ? 'text-success' :
                        'text-secondary'
                      }`}>
                        {action.type === 'UPDATE_CATEGORY' ? 'edit' :
                         action.type === 'CREATE_CATEGORY' ? 'add_circle' :
                         'flag'}
                      </span>
                      <span className="text-[9px] font-body font-bold text-gray-500 uppercase tracking-widest">
                        {action.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm font-body text-on-surface">
                      {action.type === 'UPDATE_CATEGORY' && (
                        <>Set <span className="font-bold text-primary">{action.name}</span> {action.field || 'planned'} to <span className="font-bold text-success">${action.value}</span></>
                      )}
                      {action.type === 'CREATE_CATEGORY' && (
                        <>Create <span className="font-bold text-success">{action.name}</span> in {action.section}</>
                      )}
                      {action.type === 'UPDATE_GOAL' && (
                        <>Update <span className="font-bold text-secondary">{action.goalName}</span> to <span className="font-bold text-success">${action.currentAmount}</span></>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {/* Apply Button */}
              <div className="px-6 py-4 border-t border-outline-variant">
                <button
                  onClick={handleApplyPlan}
                  className="w-full py-4 bg-gradient-to-r from-primary to-amber-500 text-background rounded-2xl font-headline font-bold text-sm hover:opacity-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-lg">bolt</span>
                  Apply All {pendingActions.length} Actions
                </button>
                <button
                  onClick={() => { clearActions(); setShowActions(false); }}
                  className="w-full mt-2 py-2 text-gray-500 text-xs font-body hover:text-gray-300 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
