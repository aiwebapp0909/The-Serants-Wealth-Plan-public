import { createContext, useContext, useMemo, useEffect, useState, useRef } from 'react'
import { useAuth } from './AuthContext'
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'

const AppContext = createContext(null)

const defaultBudget = {
  income: [
    { id: '1', name: 'Primary Income', icon: 'person', planned: 0, actual: 0 },
  ],
  fixedBills: [
    { id: '1', name: 'Rent / Mortgage', icon: 'home', planned: 0, actual: 0 },
    { id: '2', name: 'Transportation', icon: 'directions_car', planned: 0, actual: 0 },
    { id: '3', name: 'Phone', icon: 'smartphone', planned: 0, actual: 0 },
    { id: '4', name: 'Internet', icon: 'wifi', planned: 0, actual: 0 },
    { id: '5', name: 'Utilities', icon: 'bolt', planned: 0, actual: 0 },
  ],
  food: [
    { id: '1', name: 'Groceries', icon: 'shopping_cart', planned: 0, actual: 0 },
    { id: '2', name: 'Eating Out', icon: 'restaurant', planned: 0, actual: 0 },
  ],
  savings: [{ id: '1', name: 'Emergency Fund', icon: 'savings', planned: 0, actual: 0 }],
  investing: [{ id: '1', name: 'Index Funds', icon: 'trending_up', planned: 0, actual: 0 }],
  funMoney: [{ id: '1', name: 'Personal Fun', icon: 'celebration', planned: 0, actual: 0 }],
}

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

  // ─── 1. SYNC BUDGET (per userId + month) ───────────────────────────────────
  useEffect(() => {
    if (!userId || !db) return
    const budgetId = `${userId}_${currentMonth}`
    const bRef = doc(db, 'budgets', budgetId)
    const unsub = onSnapshot(bRef, (snap) => {
      isSyncing.current = true
      if (snap.exists()) {
        setBudgets(prev => ({ ...prev, [currentMonth]: snap.data() }))
      } else {
        setDoc(bRef, { ...defaultBudget, userId, month: currentMonth })
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
  const safe = (arr) => Array.isArray(arr) ? arr : []

  const totalIncome = useMemo(() => safe(budget.income).reduce((s, i) => s + Number(i.actual || 0), 0), [budget])
  const totalExpenses = useMemo(() =>
    ['fixedBills', 'food', 'funMoney'].reduce((sum, sec) =>
      sum + safe(budget[sec]).reduce((s, i) => s + Math.abs(Number(i.actual || 0)), 0), 0), [budget])
  const totalSavings = useMemo(() => safe(budget.savings).reduce((s, i) => s + Number(i.actual || 0), 0), [budget])
  const totalInvesting = useMemo(() => safe(budget.investing).reduce((s, i) => s + Number(i.actual || 0), 0), [budget])

  const totalPlannedIncome = useMemo(() => safe(budget.income).reduce((s, i) => s + Number(i.planned || 0), 0), [budget])
  const totalPlannedExpenses = useMemo(() =>
    ['fixedBills', 'food', 'funMoney'].reduce((sum, sec) =>
      sum + safe(budget[sec]).reduce((s, i) => s + Math.abs(Number(i.planned || 0)), 0), 0), [budget])
  const totalPlannedSavings = useMemo(() => safe(budget.savings).reduce((s, i) => s + Number(i.planned || 0), 0), [budget])
  const totalPlannedInvesting = useMemo(() => safe(budget.investing).reduce((s, i) => s + Number(i.planned || 0), 0), [budget])

  const totalAssets = useMemo(() => {
    const { cash = 0, realEstate = 0, vehicles = 0, other = 0 } = netWorthData.assets || {}
    return Number(cash) + Number(realEstate) + Number(vehicles) + Number(other) + totalSavings + totalInvesting
  }, [netWorthData.assets, totalSavings, totalInvesting])

  const totalLiabilities = useMemo(() =>
    Object.values(netWorthData.liabilities || {}).reduce((s, v) => s + Number(v || 0), 0), [netWorthData.liabilities])

  const netWorth = totalAssets - totalLiabilities
  const unassigned = totalIncome - (totalExpenses + totalSavings + totalInvesting)
  const unassignedPlanned = totalPlannedIncome - (totalPlannedExpenses + totalPlannedSavings + totalPlannedInvesting)

  // ─── BUDGET ACTIONS ─────────────────────────────────────────────────────────
  const updateBudgetItem = (section, id, field, value) => {
    let v = Number(value) || 0
    if (['fixedBills', 'food', 'funMoney'].includes(section)) v = -Math.abs(v)
    else v = Math.abs(v)
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [section]: prev[currentMonth][section].map(item => item.id === id ? { ...item, [field]: v } : item)
      }
    }))
  }

  const addBudgetItem = (section, name = 'New Item') => {
    const iconMap = { income: 'payments', fixedBills: 'receipt', food: 'lunch_dining', savings: 'savings', investing: 'bar_chart', funMoney: 'celebration' }
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [section]: [...safe(prev[currentMonth]?.[section]), { id: Date.now().toString(), name, icon: iconMap[section] || 'circle', planned: 0, actual: 0 }]
      }
    }))
  }

  const removeBudgetItem = (section, id) => {
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: { ...prev[currentMonth], [section]: prev[currentMonth][section].filter(i => i.id !== id) }
    }))
  }

  // ─── GOAL ACTIONS ───────────────────────────────────────────────────────────
  const updateGoal = (id, field, value) =>
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: ['current', 'target'].includes(field) ? Number(value) || 0 : value } : g))
  const addGoal = (goal) => setGoals(prev => [...prev, { ...goal, id: Date.now().toString() }])
  const removeGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id))

  // ─── TRANSACTION ACTIONS ────────────────────────────────────────────────────
  const addTransaction = (tx) => setTransactions(prev => [{ ...tx, id: Date.now().toString(), date: tx.date || new Date().toISOString().split('T')[0] }, ...prev])
  const removeTransaction = (id) => setTransactions(prev => prev.filter(t => t.id !== id))

  // ─── DERIVED ────────────────────────────────────────────────────────────────
  const healthScore = useMemo(() => {
    let score = 0
    const sr = totalIncome > 0 ? (totalSavings + totalInvesting) / totalIncome : 0
    if (sr >= 0.2) score += 40; else if (sr >= 0.1) score += 20
    if (totalLiabilities === 0) score += 30; else if (totalLiabilities < totalAssets / 2) score += 15
    if (goals.some(g => g.name.includes('Emergency Fund') && g.current >= g.target)) score += 30
    return score
  }, [totalIncome, totalSavings, totalInvesting, totalAssets, totalLiabilities, goals])

  const nextImmediateGoal = useMemo(() => goals.find(g => g.isImmediate && g.current < g.target), [goals])
  const nextGoal = useMemo(() => goals.find(g => !g.isImmediate && !g.isUltimate && g.current < g.target), [goals])
  const ultimateGoal = useMemo(() => goals.find(g => g.isUltimate), [goals])

  return (
    <AppContext.Provider value={{
      budget, budgets, currentMonth, switchMonth: setCurrentMonth,
      unassigned, unassignedPlanned,
      netWorthData, netWorth, totalAssets, totalLiabilities,
      goals, transactions, healthScore,
      totalIncome, totalExpenses, totalSavings, totalInvesting,
      totalPlannedIncome, totalPlannedExpenses, totalPlannedSavings, totalPlannedInvesting,
      updateBudgetItem, addBudgetItem, removeBudgetItem,
      updateNetWorthField: (type, field, value) => setNetWorthData(prev => ({ ...prev, [type]: { ...prev[type], [field]: Number(value) || 0 } })),
      updateGoal, addGoal, removeGoal,
      addTransaction, removeTransaction,
      nextImmediateGoal, nextGoal, ultimateGoal,
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
