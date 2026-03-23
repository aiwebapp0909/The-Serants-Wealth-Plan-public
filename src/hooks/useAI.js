import OpenAI from 'openai'
import { useState } from 'react'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Required for demo apps without a proxy backend
  baseURL: 'https://openrouter.ai/api/v1', // Using the OpenRouter endpoint
})

export function useAI() {
  const [loading, setLoading] = useState(false)
  const [insight, setInsight] = useState(null)

  const generateInsight = async (financialData) => {
    setLoading(true)
    try {
      const prompt = `
        As a world-class financial coach for the "Serants Wealth Plan", analyze this user's data and provide ONE punchy, actionable, and encouraging insight (max 40 words).
        
        Data:
        - Net Worth: $${financialData.netWorth}
        - Monthly Income: $${financialData.income}
        - Monthly Expenses: $${financialData.expenses}
        - Savings Rate: ${financialData.savingsRate}%
        - Health Score: ${financialData.healthScore}/100
        - Next Goal: ${financialData.nextGoal}
        - Target Wealth: $20M
        
        Focus on: High-leverage moves, emotional encouragement, or specific budget adjustments. 
        Tone: Premium, smart, fintech coach. No generic advice.
      `
      
      const response = await openai.chat.completions.create({
        model: 'google/gemini-pro-1.5-exp', // Good model for financial logic on OpenRouter
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
      })

      setInsight(response.choices[0].message.content)
    } catch (e) {
      console.error('AI Insight failed', e)
      setInsight("Keep pushing toward your $20M goal. Focus on consistent saving and checking your budget weekly.")
    } finally {
      setLoading(false)
    }
  }

  return { generateInsight, insight, loading }
}
