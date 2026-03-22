import { createContext, useContext, useMemo, useEffect, useState, useRef } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useAuth } from './AuthContext'
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'

const AppContext = createContext(null)

const defaultSettings = { partner1: 'Partner 1', partner2: 'Partner 2' }
const defaultBudget = {
  income: [
    { id: '1', name: 'Partner 1', icon: 'person', planned: 0, actual: 0 },
    { id: '2', name: 'Partner 2', icon: 'storefront', planned: 0, actual: 0 },
  ],
  fixedBills: [
    { id: '1', name: 'Rent', icon: 'home', planned: 0, actual: 0 },
    { id: '2', name: 'Transportation', icon: 'directions_car', planned: 0, actual: 0 },
    { id: '3', name: 'Phone', icon: 'smartphone', planned: 0, actual: 0 },
    { id: '4', name: 'Internet', icon: 'wifi', planned: 0, actual: 0 },
    { id: '5', name: 'Utilities', icon: 'bolt', planned: 0, actual: 0 },
  ],
  food: [
    { id: '1', name: 'Groceries', icon: 'shopping_cart', planned: 0, actual: 0 },
    { id: '2', name: 'Eating Out', icon: 'restaurant', planned: 0, actual: 0 },
  ],
  savings: [ { id: '1', name: 'Emergency Fund', icon: 'savings', planned: 0, actual: 0 } ],
  investing: [ { id: '1', name: 'Vanguard Index Funds', icon: 'trending_up', planned: 0, actual: 0 } ],
  funMoney: [
    { id: '1', name: 'Partner 1', icon: 'sports_esports', planned: 0, actual: 0 },
    { id: '2', name: 'Partner 2', icon: 'spa', planned: 0, actual: 0 },
  ],
}
const defaultNetWorth = {
  assets: { cash: 0, investments: 0, realEstate: 0, vehicles: 0, other: 0 },
  liabilities: { creditCards: 0, loans: 0, mortgage: 0, otherDebt: 0 },
  history: [],
}
const defaultGoals = [
  // PHASE 1: FINANCIAL STABILITY
  { id: '1', name: 'Starter Emergency Fund', target: 1000, current: 0, deadline: '2026-12-31', phase: '🟢 PHASE 1: FINANCIAL STABILITY', isImmediate: true, description: 'Initial $1,000 cash buffer for unexpected expenses.' },
  { id: '2', name: 'Debt Elimination', target: 5000, current: 0, deadline: '2027-06-30', phase: '🟢 PHASE 1: FINANCIAL STABILITY', description: 'Pay off all non-mortgage debt using the snowball method.' },
  { id: '3', name: 'Fully Funded Emergency Fund', target: 30000, current: 0, deadline: '2027-12-31', phase: '🟢 PHASE 1: FINANCIAL STABILITY', description: '3–6 months of living expenses saved in a HYSA.' },
  { id: '4', name: 'Protection System', target: 1, current: 0, deadline: '2027-12-31', phase: '🟢 PHASE 1: FINANCIAL STABILITY', description: 'Life, Health, Disability insurance and ID theft protection.' },
  
  // PHASE 2: WEALTH BUILDING
  { id: '5', name: 'Consistent Investing', target: 30000, current: 0, deadline: '2028-12-31', phase: '🔵 PHASE 2: WEALTH BUILDING', description: 'Invest 15%+ of household income (min. $2,500/mo).' },
  { id: '6', name: 'Lifestyle + Flexibility Funds', target: 10000, current: 0, deadline: '2028-12-31', phase: '🔵 PHASE 2: WEALTH BUILDING', description: 'Life buckets: Vacation, Fun experiences, Large purchases.' },
  
  // PHASE 3: FAMILY + ASSET BUILDING
  { id: '7', name: 'Home Ownership', target: 60000, current: 0, deadline: '2033-12-31', phase: '🟣 PHASE 3: FAMILY + ASSETS', description: 'Buy a house and begin mortgage payoff strategy.' },
  { id: '8', name: 'Children Wealth System', target: 100000, current: 0, deadline: '2033-12-31', phase: '🟣 PHASE 3: FAMILY + ASSETS', description: 'Start investment accounts for each child.' },
  { id: '9', name: 'Legal & Protection Setup', target: 1, current: 0, deadline: '2033-12-31', phase: '🟣 PHASE 3: FAMILY + ASSETS', description: 'Will, Trust, and Estate planning.' },
  
  // PHASE 5: FINANCIAL FREEDOM
  { id: '10', name: '$20M Net Worth', target: 20000000, current: 0, deadline: '2066-12-31', phase: '🔴 PHASE 5: FINANCIAL FREEDOM', isUltimate: true, description: 'The ultimate destination of the Serants Wealth Plan.' },
]

const getMonthKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function AppProvider({ children }) {
  const { userProfile } = useAuth()
  const groupId = userProfile?.groupId

  const [settings, setSettings] = useLocalStorage('swp_settings', defaultSettings)
  const [budgets, setBudgets] = useLocalStorage('swp_budgets', { [getMonthKey()]: defaultBudget })
  const [currentMonth, setCurrentMonth] = useState(getMonthKey())
  const [netWorthData, setNetWorthData] = useLocalStorage('swp_networth', defaultNetWorth)
  const [goals, setGoals] = useLocalStorage('swp_goals', defaultGoals)
  const [transactions, setTransactions] = useLocalStorage('swp_transactions', [])
  
  const budget = budgets[currentMonth] || defaultBudget
  const isSyncing = useRef(false)

  // Sync with Firestore if groupId exists
  useEffect(() => {
    if (!groupId || !db) return
    const docRef = doc(db, 'groups', groupId)
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()
        isSyncing.current = true
        if (data.settings) setSettings(data.settings)
        if (data.budgets) setBudgets(data.budgets)
        if (data.netWorthData) setNetWorthData(data.netWorthData)
        if (data.goals) setGoals(data.goals)
        if (data.transactions) setTransactions(data.transactions)
        setTimeout(() => { isSyncing.current = false }, 100)
      } else {
        setDoc(docRef, { settings, budgets, netWorthData, goals, transactions })
      }
    })
    return () => unsubscribe()
  }, [groupId])

  // Push changes to Firestore
  useEffect(() => {
    if (!groupId || !db || isSyncing.current) return
    const docRef = doc(db, 'groups', groupId)
    const timeout = setTimeout(() => {
      setDoc(docRef, { settings, budgets, netWorthData, goals, transactions }, { merge: true })
    }, 1000)
    return () => clearTimeout(timeout)
  }, [settings, budgets, netWorthData, goals, transactions, groupId])

  // ZERO-BASED CALCULATIONS
  const totalIncome = useMemo(() => budget.income.reduce((s, i) => s + Number(i.actual || 0), 0), [budget])
  const totalExpenses = useMemo(() =>
    ['fixedBills', 'food', 'funMoney'].reduce((sum, section) =>
      sum + (budget[section] || []).reduce((s, i) => s + Math.abs(Number(i.actual || 0)), 0), 0
    ), [budget])

  const totalSavings = useMemo(() => (budget.savings || []).reduce((s, i) => s + Number(i.actual || 0), 0), [budget])
  const totalInvesting = useMemo(() => (budget.investing || []).reduce((s, i) => s + Number(i.actual || 0), 0), [budget])

  const totalPlannedIncome = useMemo(() => budget.income.reduce((s, i) => s + Number(i.planned || 0), 0), [budget])
  const totalPlannedExpenses = useMemo(() =>
    ['fixedBills', 'food', 'funMoney'].reduce((sum, section) =>
      sum + (budget[section] || []).reduce((s, i) => s + Math.abs(Number(i.planned || 0)), 0), 0
    ), [budget])
  const totalPlannedSavings = useMemo(() => (budget.savings || []).reduce((s, i) => s + Number(i.planned || 0), 0), [budget])
  const totalPlannedInvesting = useMemo(() => (budget.investing || []).reduce((s, i) => s + Number(i.planned || 0), 0), [budget])

  // Assets = Cash + Savings + Investments + Equity
  // For simplicity, we use netWorthData fields but map them to the new logic
  const totalAssets = useMemo(() => {
    const cash = Number(netWorthData.assets.cash || 0)
    const realEstate = Number(netWorthData.assets.realEstate || 0)
    const vehicles = Number(netWorthData.assets.vehicles || 0)
    const other = Number(netWorthData.assets.other || 0)
    // Savings and Investments come from both current budget total and historical data
    const assetsTotal = cash + totalSavings + totalInvesting + realEstate + vehicles + other
    return assetsTotal
  }, [netWorthData.assets, totalSavings, totalInvesting])

  const totalLiabilities = useMemo(() => Object.values(netWorthData.liabilities).reduce((s, v) => s + Number(v || 0), 0), [netWorthData.liabilities])
  const netWorth = totalAssets - totalLiabilities

  // Unassigned Money = Income - (Expenses + Savings + Investing)
  const unassigned = totalIncome - (totalExpenses + totalSavings + totalInvesting)
  const unassignedPlanned = totalPlannedIncome - (totalPlannedExpenses + totalPlannedSavings + totalPlannedInvesting)

  const updateBudgetItem = (section, id, field, value) => {
    let finalValue = Number(value) || 0
    // Force Expenses to be negative storage, even if user enters positive
    if (['fixedBills', 'food', 'funMoney'].includes(section)) {
      finalValue = -Math.abs(finalValue)
    } else {
      finalValue = Math.abs(finalValue)
    }

    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [section]: prev[currentMonth][section].map(item => item.id === id ? { ...item, [field]: finalValue } : item),
      }
    }))
  }

  const updateBudgetItemName = (section, id, name) => {
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [section]: prev[currentMonth][section].map(item => item.id === id ? { ...item, name } : item),
      }
    }))
  }

  const addBudgetItem = (section, name = 'New Item') => {
    const id = Date.now().toString()
    const iconMap = { income: 'payments', fixedBills: 'receipt', food: 'lunch_dining', savings: 'savings', investing: 'bar_chart', funMoney: 'celebration' }
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [section]: [...(prev[currentMonth][section] || []), { id, name, icon: iconMap[section] || 'circle', planned: 0, actual: 0 }],
      }
    }))
  }

  const removeBudgetItem = (section, id) => {
    setBudgets(prev => ({
      ...prev,
      [currentMonth]: {
        ...prev[currentMonth],
        [section]: prev[currentMonth][section].filter(item => item.id !== id),
      }
    }))
  }

  const switchMonth = (month) => {
    if (!budgets[month]) {
      setBudgets(prev => ({ ...prev, [month]: { ...budget } })) // Copy previous month structure
    }
    setCurrentMonth(month)
  }

  const updateNetWorthField = (type, field, value) => {
    setNetWorthData(prev => ({ ...prev, [type]: { ...prev[type], [field]: Number(value) || 0 } }))
  }

  const saveNetWorthSnapshot = () => {
    const snapshot = { date: new Date().toISOString().split('T')[0], netWorth, assets: totalAssets, liabilities: totalLiabilities }
    setNetWorthData(prev => ({
      ...prev,
      history: [...(prev.history || []).filter(h => h.date !== snapshot.date), snapshot].sort((a, b) => new Date(a.date) - new Date(b.date)),
    }))
  }

  const updateGoal = (id, field, value) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: field === 'current' || field === 'target' ? Number(value) || 0 : value } : g))
  }

  const addGoal = (goal) => setGoals(prev => [...prev, { ...goal, id: Date.now().toString() }])
  const removeGoal = (id) => setGoals(prev => prev.filter(g => g.id !== id))

  const addTransaction = (tx) => {
    const newTx = { ...tx, id: Date.now().toString(), date: tx.date || new Date().toISOString().split('T')[0] }
    setTransactions(prev => [newTx, ...prev])
    
    // Auto-update budget actuals
    const sectionMap = { 'Income': 'income', 'Fixed Bills': 'fixedBills', 'Food': 'food', 'Savings': 'savings', 'Investing': 'investing', 'Fun Money': 'funMoney' }
    const section = sectionMap[tx.category]
    if (section && budget[section] && budget[section][0]) {
      updateBudgetItem(section, budget[section][0].id, 'actual', (budget[section][0].actual || 0) + tx.amount)
    }
  }

  const healthScore = useMemo(() => {
    let score = 0
    const savingsRate = totalIncome > 0 ? (totalSavings + totalInvesting) / totalIncome : 0
    if (savingsRate >= 0.2) score += 40
    else if (savingsRate >= 0.1) score += 20
    if (totalLiabilities === 0) score += 30
    else if (totalLiabilities < totalAssets / 2) score += 15
    if (goals.some(g => g.name === 'Starter Emergency Fund' && g.current >= g.target)) score += 30
    return score
  }, [totalIncome, totalSavings, totalInvesting, totalAssets, totalLiabilities, goals])

  const nextImmediateGoal = useMemo(() => goals.find(g => g.isImmediate && g.current < g.target), [goals])
  const nextGoal = useMemo(() => goals.find(g => !g.isImmediate && !g.isUltimate && g.current < g.target), [goals])
  const ultimateGoal = useMemo(() => goals.find(g => g.isUltimate), [goals])

  return (
    <AppContext.Provider value={{
      settings, setSettings, budget, budgets, setBudgets, currentMonth, switchMonth,
      unassigned, unassignedPlanned,
      netWorthData, netWorth, totalAssets, totalLiabilities,
      goals, setGoals, transactions, healthScore,
      totalIncome, totalExpenses, totalSavings, totalInvesting,
      totalPlannedIncome, totalPlannedExpenses, totalPlannedSavings, totalPlannedInvesting,
      updateBudgetItem, updateBudgetItemName, addBudgetItem, removeBudgetItem,
      updateNetWorthField, saveNetWorthSnapshot,
      updateGoal, addGoal, removeGoal, addTransaction, removeTransaction: (id) => setTransactions(prev => prev.filter(tx => tx.id !== id)),
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
