import { useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'

/**
 * AI Coach Chat Hook
 * Manages conversation history and calls Firebase Cloud Function
 */
export function useCoachChat() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const sendMessage = async (userMessage, financialData, userId) => {
    if (!userMessage.trim()) return

    // Add user message to history
    const newUserMessage = { role: 'user', content: userMessage, timestamp: new Date() }
    setMessages(prev => [...prev, newUserMessage])
    setLoading(true)
    setError(null)

    try {
      // Call Firebase Cloud Function
      const coachChat = httpsCallable(functions, 'coachChat')
      const result = await coachChat({
        message: userMessage,
        financialData
      })

      const coachMessage = {
        role: 'assistant',
        content: result.data.reply,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, coachMessage])
    } catch (e) {
      const errorMessage = e.message || 'Failed to get response from coach'
      setError(errorMessage)
      // Add error message to chat
      setMessages(prev => [...prev, {
        role: 'system',
        content: `⚠️ ${errorMessage}`,
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearHistory = () => {
    setMessages([])
  }

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory
  }
}
