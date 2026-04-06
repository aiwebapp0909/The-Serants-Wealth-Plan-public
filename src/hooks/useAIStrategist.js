import { useState, useCallback } from 'react'

/**
 * AI Strategist Hook
 * Manages chat with the AI strategist backend and action execution
 */
export function useAIStrategist() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [pendingActions, setPendingActions] = useState([])
  const [lastPlan, setLastPlan] = useState(null)

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

  const sendMessage = useCallback(async (userMessage, financialData) => {
    if (!userMessage.trim()) return

    const newUserMsg = { role: 'user', content: userMessage, timestamp: new Date() }
    setMessages(prev => [...prev, newUserMsg])
    setLoading(true)
    setPendingActions([])
    setLastPlan(null)

    try {
      const response = await fetch(`${API_URL}/api/ai/strategist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, financialData }),
      })

      if (!response.ok) throw new Error('AI request failed')

      const data = await response.json()
      
      const assistantMsg = {
        role: 'assistant',
        content: data.humanPlan || data.raw || 'No response generated.',
        timestamp: new Date(),
        hasActions: data.actions?.length > 0,
      }
      setMessages(prev => [...prev, assistantMsg])
      
      if (data.actions?.length > 0) {
        setPendingActions(data.actions)
      }
      setLastPlan(data.humanPlan)

    } catch (e) {
      console.error('AI Strategist error:', e)
      setMessages(prev => [...prev, {
        role: 'system',
        content: `⚠️ ${e.message || 'Failed to get AI response'}`,
        timestamp: new Date(),
      }])
    } finally {
      setLoading(false)
    }
  }, [API_URL])

  const clearHistory = useCallback(() => {
    setMessages([])
    setPendingActions([])
    setLastPlan(null)
  }, [])

  const clearActions = useCallback(() => {
    setPendingActions([])
  }, [])

  return {
    messages,
    loading,
    pendingActions,
    lastPlan,
    sendMessage,
    clearHistory,
    clearActions,
  }
}
