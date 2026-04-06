import { createContext, useContext, useMemo, useEffect, useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const AppContext = createContext(null)

const CATEGORIES = [
  'Income', 'Housing', 'Bills & Utilities', 'Food & Dining', 'Transportation',
  'Insurance', 'Subscriptions', 'Shopping', 'Entertainment', 'Healthcare',
  'Savings', 'Investing', 'Other'
]

const defaultBudget = CATEGORIES.reduce((acc, cat) => {
  acc[cat] = { planned: 0, actual: null } // actual: null means it auto-pulls from transactions
  return acc
}, {})

const defaultNetWorth = {
  assets: { cash: 0, investments: 0, realEstate: 0, vehicles: 0, other: 0 },
  liabilities: { creditCards: 0, loans: 0, mortgage: 0, otherDebt: 0 },
  history: [],
}

const defaultGoals = [
  // PHASE 1: FINANCIAL STABILITY
  { id: '1', name: 'Starter Emergency Fund', target: 1000, current: 0, phase: 'PHASE 1', isImmediate: true, description: 'Save initial $1,000 cash buffer to handle unexpected expenses without debt.' },
  { id: '2', name: 'Debt Elimination', target: 5000, current: 0, phase: 'PHASE 1', description: 'Pay off all non-mortgage debt using the snowball method (small → large balances).' },
  { id: '3', name: 'Fully Funded Emergency Fund', target: 30000, current: 0, phase: 'PHASE 1', description: '3–6 months of living expenses saved in a high-yield savings account.' },
  { id: '4', name: 'Protection System', target: 1, current: 0, phase: 'PHASE 1', description: 'Life, Health, Disability insurance and identity theft protection in place.' },
  // PHASE 2: WEALTH BUILDING
  { id: '5', name: 'Consistent Investing', target: 30000, current: 0, phase: 'PHASE 2', description: 'Invest 15%+ of household income. Minimum $2,500/month investing starting now.' },
  { id: '6', name: 'Lifestyle + Flexibility Funds', target: 10000, current: 0, phase: 'PHASE 2', description: 'Vacation fund, fun experiences, large purchases (car, travel) to prevent burnout.' },
  // PHASE 3: FAMILY + ASSETS
  { id: '7', name: 'Home Ownership', target: 60000, current: 0, phase: 'PHASE 3', description: 'Buy a primary residence. Begin mortgage payoff strategy.' },
  { id: '8', name: 'Children Wealth System', target: 100000, current: 0, phase: 'PHASE 3', description: 'Start investment accounts for each child. Long-term compounding.' },
  { id: '9', name: 'Legal & Protection Setup', target: 1, current: 0, phase: 'PHASE 3', description: 'Will, Trust, and Estate Planning fully in place.' },
  // PHASE 4: FINANCIAL FREEDOM
  { id: '10', name: '$20M Net Worth', target: 20000000, current: 0, phase: 'PHASE 4', isUltimate: true, description: 'The ultimate destination of the Serants Wealth Plan.' },
]

const getMonthKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function AppProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.uid

  const [budgets, setBudgets] = useState({ [getMonthKey()]: defaultBudget })
  const [currentMonth, setCurrentMonth] = useState(getMonthKey())
  const [netWorthData, setNetWorthData] = useState(defaultNetWorth)
  const [goals, setGoals] = useState(defaultGoals)
  const [transactions, setTransactions] = useState([])
  const isSyncing = useRef(false)

  // ─── TRANSACTION REAL-TIME SYNC ───────────────────────────────────────────
  useEffect(() => {
    if (!userId || !db) return
    const q = query(collection(db, 'transactions'), where('userId', '==', userId))
    const unsub = onSnapshot(q, (snap) => {
      const txs = []
      snap.forEach(d => txs.push({ id: d.id, ...d.data() }))
      txs.sort((a, b) => new Date(b.date) - new Date(a.date))
      setTransactions(txs)
    })
    return () => unsub()
  }, [userId])

  // ─── 1. SYNC ALL BUDGETS (per userId) ──────────────────────────────────────
  useEffect(() => {
    if (!userId || !db) return
    const qParams = query(collection(db, 'budgets'), where('userId', '==', userId))
    const unsub = onSnapshot(qParams, (snap) => {
      isSyncing.current = true
      const loadedBudgets = {}
      snap.forEach(d => { loadedBudgets[d.data().month] = d.data() })
      
      setBudgets(loadedBudgets)
      
      if (!loadedBudgets[currentMonth]) {
        setDoc(doc(db, 'budgets', `${userId}_${currentMonth}`), { ...defaultBudget, userId, month: currentMonth })
      }
      setTimeout(() => { isSyncing.current = false }, 100)
    })
    return () => unsub()
  }, [userId, currentMonth])

  // ─── 2. SYNC USER DATA (goals, netWorth) ───────────────────────────────────
  useEffect(() => {
    if (!userId || !db) return
    const uRef = doc(db, 'userData', userId)
    const unsub = onSnapshot(uRef, (snap) => {
      isSyncing.current = true
      if (snap.exists()) {
        const d = snap.data()
        if (d.goals) setGoals(d.goals)
        if (d.netWorthData) setNetWorthData(d.netWorthData)
        if (d.transactions) setTransactions(d.transactions)
      } else {
        setDoc(uRef, { goals: defaultGoals, netWorthData: defaultNetWorth, transactions: [], userId })
      }
      setTimeout(() => { isSyncing.current = false }, 100)
    })
    return () => unsub()
  }, [userId])

  // ─── 3. AUTO-SAVE BUDGET ────────────────────────────────────────────────────
  const budget = budgets[currentMonth] || defaultBudget
  useEffect(() => {
    if (!userId || !db || isSyncing.current) return
    const id = setTimeout(() => {
      setDoc(doc(db, 'budgets', `${userId}_${currentMonth}`), { ...budget, userId, month: currentMonth }, { merge: true })
    }, 800)
    return () => clearTimeout(id)
  }, [budget, userId, currentMonth])

  // ─── 4. AUTO-SAVE USER DATA ─────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !db || isSyncing.current) return
    const id = setTimeout(() => {
      setDoc(doc(db, 'userData', userId), { goals, netWorthData, transactions, userId }, { merge: true })
    }, 800)
    return () => clearTimeout(id)
  }, [goals, netWorthData, transactions, userId])

  // ─── CALCULATIONS ───────────────────────────────────────────────────────────
  const EXPENSE_CATEGORIES = ['Housing', 'Bills & Utilities', 'Food & Dining', 'Transportation', 'Insurance', 'Subscriptions', 'Shopping', 'Entertainment', 'Healthcare', 'Other']

  // Auto-calculate from transactions
  const monthTransactions = useMemo(() => {
    return transactions.filter(t => t.date && t.date.startsWith(currentMonth))
  }, [transactions, currentMonth])

  const transactionSums = useMemo(() => {
    const sums = {}
    monthTransactions.forEach(t => {
      // Default missing categories to Other
      const cat = t.category || 'Other'
      sums[cat] = (sums[cat] || 0) + Math.abs(t.amount || 0)
    })
    return sums
  }, [monthTransactions])

  const getActual = (cat) => {
    const b = budget[cat]
    if (b && b.actual !== null && b.actual !== undefined && b.actual !== '') {
      return Number(b.actual)
    }
    return transactionSums[cat] || 0
  }

  const getPlanned = (cat) => Number(budget[cat]?.planned || 0)

  const totalIncome = useMemo(() => getActual('Income'), [budget, transactionSums])
  const totalExpenses = useMemo(() => EXPENSE_CATEGORIES.reduce((s, cat) => s + getActual(cat), 0), [budget, transactionSums])
  const totalSavings = useMemo(() => getActual('Savings'), [budget, transactionSums])
  const totalInvesting = useMemo(() => getActual('Investing'), [budget, transactionSums])

  const totalPlannedIncome = useMemo(() => getPlanned('Income'), [budget])
  const totalPlannedExpenses = useMemo(() => EXPENSE_CATEGORIES.reduce((s, cat) => s + getPlanned(cat), 0), [budget])
  const totalPlannedSavings = useMemo(() => getPlanned('Savings'), [budget])
  const totalPlannedInvesting = useMemo(() => getPlanned('Investing'), [budget])

  // GLOBAL SAVINGS ACROSS ALL MONTHS
  const globalSavingsActual = useMemo(() => {
    let total = 0
    const uniqueMonths = new Set([...Object.keys(budgets), ...transactions.map(t => t.date?.substring(0, 7)).filter(Boolean)])
    
    uniqueMonths.forEach(m => {
      const b = budgets[m]
      if (b && b['Savings'] && b['Savings'].actual !== null && b['Savings'].actual !== undefined && b['Savings'].actual !== '') {
        total += Number(b['Savings'].actual)
      } else {
        const monthTxs = transactions.filter(t => t.date?.startsWith(m) && t.category === 'Savings')
        total += monthTxs.reduce((acc, t) => acc + Math.abs(t.amount || 0), 0)
      }
    })
    return total
  }, [budgets, transactions])

  // AUTO-SYNC GOALS
  const syncedGoals = useMemo(() => {
    let remainingSavings = globalSavingsActual
    return goals.map(g => {
      if (!g.active) return g
      // Distribute global savings automatically into active goals sequentially
      const amountForThisGoal = Math.min(remainingSavings, g.target)
      remainingSavings = Math.max(0, remainingSavings - amountForThisGoal)
      return { ...g, current: amountForThisGoal }
    })
  }, [goals, globalSavingsActual])

  const totalAssets = useMemo(() => {
    const { cash = 0, realEstate = 0, vehicles = 0, other = 0 } = netWorthData.assets || {}
    return Number(cash) + Number(realEstate) + Number(vehicles) + Number(other) + globalSavingsActual + totalInvesting
  }, [netWorthData.assets, globalSavingsActual, totalInvesting])

  const totalLiabilities = useMemo(() =>
    Object.values(netWorthData.liabilities || {}).reduce((s, v) => s + Number(v || 0), 0), [netWorthData.liabilities])

  const netWorth = totalAssets - totalLiabilities
  const unassigned = totalIncome + totalExpenses - (totalSavings + totalInvesting)
  const unassignedPlanned = totalPlannedIncome + totalPlannedExpenses - (totalPlannedSavings + totalPlannedInvesting)

  // ─── BUDGET ACTIONS ─────────────────────────────────────────────────────────
  const updateBudgetItem = (category, field, value) => {
    let v = value
    // Only coerce to number for planned/actual, not for recurring
    if (field === 'planned' || field === 'actual') {
      v = value === null ? null : Math.abs(Number(value) || 0)
      if (value === '') v = null // handle empty string as fallback to transactions
    }
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [category]: {
          ...(prev[currentMonth]?.[category] || { planned: 0, actual: null }),
          [field]: v
        }
      }
    }))
  }

  // ─── GOAL ACTIONS ───────────────────────────────────────────────────────────
  const updateGoal = (id, field, value) =>
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: ['current', 'target'].includes(field) ? Number(value) || 0 : value } : g))
  const addGoal = (goal) => setGoals(prev => [...prev, { ...goal, id: Date.now().toString() }])
  const removeGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id))
  const startGoal = (id, deadline) => setGoals(prev => prev.map(g => g.id === id ? { ...g, deadline, active: true } : g))
  const stopGoal = (id) => setGoals(prev => prev.map(g => g.id === id ? { ...g, active: false } : g))

  // ─── TRANSACTION ACTIONS ────────────────────────────────────────────────────
  const addTransaction = (tx) => setTransactions(prev => [{ ...tx, id: Date.now().toString(), date: tx.date || new Date().toISOString().split('T')[0] }, ...prev])
  const removeTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id))

  // ─── DERIVED ────────────────────────────────────────────────────────────────
  const healthScore = useMemo(() => {
    let score = 0
    const sr = totalIncome > 0 ? (totalSavings + totalInvesting) / totalIncome : 0
    if (sr >= 0.2) score += 40; else if (sr >= 0.1) score += 20
    if (totalLiabilities === 0) score += 30; else if (totalLiabilities < totalAssets / 2) score += 15
    if (syncedGoals.some(g => g.name.includes('Emergency Fund') && g.current >= g.target)) score += 30
    return score
  }, [totalIncome, totalSavings, totalInvesting, totalAssets, totalLiabilities, syncedGoals])

  const nextImmediateGoal = useMemo(() => syncedGoals.find(g => g.isImmediate && g.current < g.target), [syncedGoals])
  const nextGoal = useMemo(() => syncedGoals.find(g => !g.isImmediate && !g.isUltimate && g.current < g.target), [syncedGoals])
  const ultimateGoal = useMemo(() => syncedGoals.find(g => g.isUltimate), [syncedGoals])
  const activeGoals = useMemo(() => syncedGoals.filter(g => g.active && g.deadline && g.current < g.target), [syncedGoals])

  // ─── AI ACTION EXECUTOR ──────────────────────────────────────────────────────
  const executeAIActions = (actions) => {
    if (!Array.isArray(actions)) return { success: 0, failed: 0 }
    let success = 0, failed = 0

    actions.forEach(action => {
      try {
        switch (action.type) {
          case 'UPDATE_CATEGORY': {
            const cat = action.category || action.section
            if (!CATEGORIES.includes(cat)) { failed++; break }
            updateBudgetItem(cat, action.field || 'planned', action.value)
            success++
            break
          }
          case 'CREATE_CATEGORY': {
            // Deprecated logically since we use fixed 13 categories
            failed++
            break
          }
          case 'UPDATE_GOAL': {
            const goal = goals.find(g => g.name.toLowerCase() === (action.goalName || '').toLowerCase())
            if (goal) {
              updateGoal(goal.id, 'current', action.currentAmount)
              success++
            } else { failed++ }
            break
          }
          default:
            failed++
        }
      } catch (e) {
        console.error('Action execution error:', e)
        failed++
      }
    })

    return { success, failed }
  }

  return (
    <AppContext.Provider value={{
      budget, budgets, currentMonth, switchMonth: setCurrentMonth,
      unassigned, unassignedPlanned, globalSavingsActual,
      netWorthData, netWorth, totalAssets, totalLiabilities,
      goals: syncedGoals, transactions, healthScore,
      totalIncome, totalExpenses, totalSavings, totalInvesting,
      totalPlannedIncome, totalPlannedExpenses, totalPlannedSavings, totalPlannedInvesting,
      getActual, getPlanned, EXPENSE_CATEGORIES,
      updateBudgetItem,
      updateNetWorthField: (type, field, value) => setNetWorthData(prev => ({ ...prev, [type]: { ...prev[type], [field]: Number(value) || 0 } })),
      updateGoal, addGoal, removeGoal, startGoal, stopGoal,
      addTransaction, removeTransaction,
      nextImmediateGoal, nextGoal, ultimateGoal, activeGoals,
      executeAIActions,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
