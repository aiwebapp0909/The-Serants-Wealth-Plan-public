import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAIStrategist } from '../hooks/useAIStrategist'
import { useApp } from '../context/AppContext'

/**
 * MIDAS — The AI Wealth Executor
 * Global slide-in panel accessible from every page.
 * Swipe from right edge or tap the gold orb to open.
 */
export default function MidasPanel() {
  const {
    budget, goals, netWorth, totalIncome, totalExpenses,
    totalSavings, totalInvesting, healthScore, executeAIActions,
  } = useApp()

  const { messages, loading, pendingActions, sendMessage, clearHistory, clearActions } = useAIStrategist()
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [executionResult, setExecutionResult] = useState(null)
  const messagesEndRef = useRef(null)
  const panelRef = useRef(null)
  const touchStartX = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Global swipe detection — swipe from right edge to left
  useEffect(() => {
    const handleTouchStart = (e) => {
      if (!e.touches || !e.touches[0]) return
      const touch = e.touches[0]
      // Only detect swipe starting from the right 40px edge
      if (touch.clientX > window.innerWidth - 40) {
        touchStartX.current = touch.clientX
      }
    }

    const handleTouchMove = (e) => {
      if (touchStartX.current === null) return
      if (!e.touches || !e.touches[0]) return
      const touch = e.touches[0]
      const diff = touchStartX.current - touch.clientX
      if (diff > 60) {
        setIsOpen(true)
        touchStartX.current = null
      }
    }

    const handleTouchEnd = () => {
      touchStartX.current = null
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const financialData = {
    budget: budget ? Object.fromEntries(
      Object.entries(budget).map(([key, items]) => [
        key,
        Array.isArray(items) ? items.map(i => ({ name: i.name, planned: Math.abs(i.planned || 0), actual: Math.abs(i.actual || 0), recurring: i.recurring || false })) : []
      ])
    ) : {},
    goals: (goals || []).map(g => ({ name: g.name, target: g.target, current: g.current, active: g.active, deadline: g.deadline })),
    netWorth: netWorth || 0,
    totalIncome: totalIncome || 0,
    totalExpenses: Math.abs(totalExpenses || 0),
    totalSavings: totalSavings || 0,
    totalInvesting: totalInvesting || 0,
    healthScore: healthScore || 0,
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return
    setExecutionResult(null)
    await sendMessage(input, financialData)
    setInput('')
  }

  const handleApply = () => {
    if (!pendingActions.length) return
    const result = executeAIActions(pendingActions)
    setExecutionResult(result)
    clearActions()
  }

  const quickActions = [
    { label: "Optimize my budget", icon: "auto_fix_high" },
    { label: "Create next month's plan", icon: "calendar_month" },
    { label: "How to save more?", icon: "savings" },
    { label: "Weekly spending plan", icon: "view_week" },
  ]

  return (
    <>
      {/* MIDAS ORB — Always visible on right edge */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed right-3 bottom-24 z-[90] w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 shadow-lg shadow-amber-500/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ x: 80 }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25, delay: 1 }}
      >
        <span className="material-symbols-outlined text-background text-xl font-bold">auto_awesome</span>
      </motion.button>

      {/* MIDAS PANEL */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[150] bg-background/60 backdrop-blur-sm"
            />

            {/* Panel */}
            <motion.div
              ref={panelRef}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-md bg-surface border-l border-outline-variant shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="px-4 py-4 border-b border-outline-variant flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md shadow-amber-500/20">
                    <span className="material-symbols-outlined text-background text-lg font-bold">auto_awesome</span>
                  </div>
                  <div>
                    <h2 className="font-headline font-bold text-on-surface text-base tracking-tight">MIDAS</h2>
                    <p className="text-[8px] font-body font-bold text-amber-500 uppercase tracking-[0.25em]">AI Wealth Executor</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {pendingActions.length > 0 && (
                    <button
                      onClick={handleApply}
                      className="flex items-center gap-1 px-3 py-1.5 bg-success/10 border border-success/30 rounded-full text-success text-[10px] font-bold animate-pulse"
                    >
                      <span className="material-symbols-outlined text-xs">bolt</span>
                      Apply {pendingActions.length}
                    </button>
                  )}
                  {messages.length > 0 && (
                    <button onClick={clearHistory} className="text-gray-500 hover:text-on-surface p-1.5 rounded-lg hover:bg-surface-container transition-colors">
                      <span className="material-symbols-outlined text-base">delete_sweep</span>
                    </button>
                  )}
                  <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-on-surface p-1">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center pt-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mb-4">
                      <span className="material-symbols-outlined text-primary text-3xl">auto_awesome</span>
                    </div>
                    <h3 className="font-headline font-bold text-on-surface text-lg mb-1">Midas at your service</h3>
                    <p className="text-gray-500 text-xs font-body mb-6 max-w-xs">
                      Your personal AI wealth executor. Ask anything, and I'll generate plans with executable actions.
                    </p>
                    <div className="w-full space-y-2">
                      {quickActions.map((qa, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(qa.label)}
                          className="w-full flex items-center gap-2 bg-surface-container border border-outline-variant/50 rounded-xl px-3 py-2.5 text-sm font-body text-on-surface/80 hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                        >
                          <span className="material-symbols-outlined text-primary text-base">{qa.icon}</span>
                          {qa.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm font-body ${
                        msg.role === 'user'
                          ? 'bg-primary text-background rounded-br-md'
                          : msg.role === 'system'
                          ? 'bg-error/10 text-error border border-error/20'
                          : 'bg-surface-container border border-outline-variant text-on-surface rounded-bl-md'
                      }`}>
                        <div className="whitespace-pre-wrap leading-relaxed text-xs">{msg.content}</div>
                        {msg.hasActions && (
                          <div className="mt-2 pt-2 border-t border-outline-variant/50 flex items-center gap-1 text-primary text-[10px] font-bold">
                            <span className="material-symbols-outlined text-xs">bolt</span> Actions ready
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-surface-container border border-outline-variant rounded-2xl px-3 py-2.5 rounded-bl-md">
                      <div className="flex gap-1.5 items-center">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                {executionResult && (
                  <div className="bg-success/10 border border-success/30 rounded-xl p-3">
                    <p className="text-xs font-bold text-success flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      {executionResult.success} actions applied{executionResult.failed > 0 ? `, ${executionResult.failed} failed` : ''}
                    </p>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-outline-variant flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Ask Midas anything..."
                    disabled={loading}
                    className="flex-1 bg-surface-container border border-outline-variant rounded-xl px-3 py-2.5 text-sm font-body text-on-surface placeholder-gray-500 outline-none focus:border-primary transition-colors"
                  />
                  <button
                    onClick={handleSend}
                    disabled={loading || !input.trim()}
                    className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-40 text-background rounded-xl flex items-center justify-center transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
