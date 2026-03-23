/**
 * Firebase Cloud Function for Coach Chat
 * Deploy as: firebase deploy --only functions
 * 
 * Setup:
 * 1. npm install openai firebase-admin
 * 2. Set OPENAI_API_KEY in Firebase config
 * 3. Deploy this function
 */

const functions = require('firebase-functions')
const admin = require('firebase-admin')
const OpenAI = require('openai').default

admin.initializeApp()
const db = admin.firestore()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

exports.coachChat = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const { message, financialData } = data
  const userId = context.auth.uid

  if (!message || typeof message !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Message is required'
    )
  }

  try {
    // Fetch user's budgets for current context
    const budgetsSnap = await db
      .collection('budgets')
      .where('userId', '==', userId)
      .orderBy('month', 'desc')
      .limit(3)
      .get()

    let budgetContext = ''
    let totalIncome = 0
    let totalExpenses = 0
    let totalSavings = 0

    budgetsSnap.forEach((doc) => {
      const data = doc.data()
      totalIncome += data.totals?.income || 0
      totalExpenses += data.totals?.expenses || 0
      totalSavings += data.totals?.savings || 0
    })

    budgetContext = `
Recent Budget Data:
- Average Monthly Income: $${Math.round(totalIncome / Math.max(budgetsSnap.size, 1))}
- Average Monthly Expenses: $${Math.round(totalExpenses / Math.max(budgetsSnap.size, 1))}
- Average Monthly Savings: $${Math.round(totalSavings / Math.max(budgetsSnap.size, 1))}
`

    // Fetch user profile
    const userSnap = await db.collection('users').doc(userId).get()
    const userName = userSnap.data()?.name || 'Friend'

    const systemPrompt = `You are a personal financial wealth coach. You have access to the user's real financial data and provide personalized, actionable advice.

${budgetContext}

Key principles:
1. Be encouraging and supportive
2. Give specific, actionable advice based on their data
3. Focus on small wins and progress toward $20M goal
4. Ask clarifying questions when needed
5. Be concise but thorough (max 150 words per response)
6. Use emojis to make advice memorable
7. Reference their actual numbers (income, expenses, savings)

Tone: Premium fintech coach - professional but friendly.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    return {
      reply: response.choices[0].message.content,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Coach chat error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate response: ' + error.message
    )
  }
})

exports.generateWeeklyReport = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'User must be authenticated'
    )
  }

  const userId = context.auth.uid

  try {
    // Get this week's data
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const transactionsSnap = await db
      .collection('transactions')
      .where('userId', '==', userId)
      .where('date', '>=', oneWeekAgo)
      .get()

    const budgetSnap = await db
      .collection('budgets')
      .where('userId', '==', userId)
      .orderBy('month', 'desc')
      .limit(1)
      .get()

    let totalSpent = 0
    const categorySpending = {}

    transactionsSnap.forEach((doc) => {
      const data = doc.data()
      totalSpent += Math.abs(data.amount || 0)
      const cat = data.category || 'Uncategorized'
      categorySpending[cat] = (categorySpending[cat] || 0) + Math.abs(data.amount || 0)
    })

    const currentBudget = budgetSnap.docs[0]?.data() || {}
    const currentIncome = currentBudget.totals?.income || 0
    const plannedExpenses = currentBudget.totals?.expenses || 0

    const prompt = `Generate a weekly financial report for this user.

Data:
- Total Spent This Week: $${Math.round(totalSpent)}
- Monthly Income: $${Math.round(currentIncome)}
- Planned Monthly Expenses: $${Math.round(plannedExpenses)}
- Spending by Category: ${JSON.stringify(categorySpending)}

Format your response as:
📊 WEEKLY SUMMARY
[2-3 sentences about spending]

💡 TOP 3 INSIGHTS
1. [insight based on data]
2. [insight based on data]
3. [insight based on data]

🎯 2 ACTIONS
1. [specific recommendation]
2. [specific recommendation]

Keep it concise, data-driven, and encouraging.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 400,
    })

    // Store report
    await db.collection('weeklyReports').add({
      userId,
      date: new Date().toISOString(),
      report: response.choices[0].message.content,
      weeklySpending: totalSpent,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return {
      report: response.choices[0].message.content,
      weeklySpending: totalSpent,
    }
  } catch (error) {
    console.error('Weekly report error:', error)
    throw new functions.https.HttpsError(
      'internal',
      'Failed to generate report: ' + error.message
    )
  }
})
