import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCoachChat } from '../hooks/useCoachChat'

export default function CoachChat({ isOpen, onClose, financialData, userId }) {
  const { messages, loading, sendMessage, clearHistory } = useCoachChat()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = async () => {
    if (!input.trim()) return
    await sendMessage(input, financialData, userId)
    setInput('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md h-[600px] flex flex-col bg-surface border border-outline-variant rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-surface-container border-b border-outline-variant p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-lg">psychology</span>
                </div>
                <div>
                  <h2 className="font-headline font-bold text-on-surface text-sm">Wealth Coach</h2>
                  <p className="text-[9px] text-gray-500">Real-time financial advice</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                  </div>
                  <p className="text-sm font-body text-gray-500 mb-2">Ask your coach anything</p>
                  <p className="text-[10px] text-gray-600 px-4">
                    💡 "How can I save more?"
                    <br />
                    💡 "Am I spending too much on food?"
                    <br />
                    💡 "Will I reach my goals?"
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl text-sm font-body ${
                        msg.role === 'user'
                          ? 'bg-primary text-background'
                          : msg.role === 'system'
                          ? 'bg-error/10 text-error'
                          : 'bg-surface-container text-on-surface'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))
              )}
              {loading && (
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-primary/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-outline-variant p-3 space-y-2 bg-surface-container/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask your coach..."
                  disabled={loading}
                  className="flex-1 bg-surface border border-outline-variant rounded-full px-4 py-2 text-sm font-body text-on-surface placeholder-gray-500 outline-none focus:border-primary transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 text-background rounded-full flex items-center justify-center transition-all"
                >
                  <span className="material-symbols-outlined">send</span>
                </button>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="w-full text-[10px] text-gray-500 hover:text-gray-400 uppercase tracking-widest font-bold py-1"
                >
                  Clear history
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
