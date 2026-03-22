import { createContext, useContext, useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const AppContext = createContext(null)

const defaultSettings = {
  partner1: 'Partner 1',
  partner2: 'Partner 2',
}

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
  savings: [
    { id: '1', name: 'Emergency Fund', icon: 'savings', planned: 0, actual: 0 },
  ],
  investing: [
    { id: '1', name: 'Vanguard Index Funds', icon: 'trending_up', planned: 0, actual: 0 },
  ],
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
  {
    id: '1',
    name: 'Dream Vacation',
    target: 5000,
    current: 0,
    deadline: '2026-12-31',
    phase: 'Immediate',
    isImmediate: true,
    description: 'Save for your dream vacation together.',
  },
  {
    id: '2',
    name: 'Starter Emergency Fund',
    target: 1000,
    current: 0,
    deadline: '2026-12-31',
    phase: 'Phase 1: Financial Stability',
    description: 'Save initial $1,000 cash buffer to handle unexpected expenses without debt.',
  },
  {
    id: '3',
    name: 'Full Emergency Fund',
    target: 30000,
    current: 0,
    deadline: '2027-12-31',
    phase: 'Year 1',
    description: '6 months of expenses saved.',
  },
  {
    id: '4',
    name: '$0 Debt',
    target: 0,
    current: 0,
    deadline: '2027-12-31',
    phase: 'Year 1',
    isDebtGoal: true,
    description: 'Eliminate all consumer debt.',
  },
  {
    id: '5',
    name: 'Invest $2,500/month',
    target: 30000,
    current: 0,
    deadline: '2028-12-31',
    phase: 'Year 2+',
    description: 'Consistent monthly investment habit.',
  },
  {
    id: '6',
    name: '$500K Net Worth',
    target: 500000,
    current: 0,
    deadline: '2033-12-31',
    phase: 'Year 7',
    description: 'Half-million milestone.',
  },
  {
    id: '7',
    name: 'Buy a House',
    target: 60000,
    current: 0,
    deadline: '2033-12-31',
    phase: 'Year 7',
    description: 'Save down payment for primary home.',
  },
  {
    id: '8',
    name: '$20M Net Worth',
    target: 20000000,
    current: 0,
    deadline: '2066-12-31',
    phase: 'Ultimate Goal',
    isUltimate: true,
    description: 'The ultimate destination of the Serants Wealth Plan.',
  },
]

export function AppProvider({ children }) {
  const [settings, setSettings] = useLocalStorage('swp_settings', defaultSettings)
  const [budget, setBudget] = useLocalStorage('swp_budget', defaultBudget)
  const [netWorthData, setNetWorthData] = useLocalStorage('swp_networth', defaultNetWorth)
  const [goals, setGoals] = useLocalStorage('swp_goals', defaultGoals)
  const [transactions, setTransactions] = useLocalStorage('swp_transactions', [])

  const totalIncome = useMemo(() =>
    budget.income.reduce((s, i) => s + Number(i.actual || 0), 0), [budget.income])

  const totalExpenses = useMemo(() =>
    ['fixedBills', 'food', 'savings', 'investing', 'funMoney'].reduce((sum, section) =>
      sum + (budget[section] || []).reduce((s, i) => s + Number(i.actual || 0), 0), 0
    ), [budget])

  const totalPlannedIncome = useMemo(() =>
    budget.income.reduce((s, i) => s + Number(i.planned || 0), 0), [budget.income])

  const totalPlannedExpenses = useMemo(() =>
    ['fixedBills', 'food', 'savings', 'investing', 'funMoney'].reduce((sum, section) =>
      sum + (budget[section] || []).reduce((s, i) => s + Number(i.planned || 0), 0), 0
    ), [budget])

  const totalAssets = useMemo(() =>
    Object.values(netWorthData.assets).reduce((s, v) => s + Number(v || 0), 0),
    [netWorthData.assets])

  const totalLiabilities = useMemo(() =>
    Object.values(netWorthData.liabilities).reduce((s, v) => s + Number(v || 0), 0),
    [netWorthData.liabilities])

  const netWorth = totalAssets - totalLiabilities

  const updateBudgetItem = (section, id, field, value) => {
    setBudget(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, [field]: Number(value) || 0 } : item
      ),
    }))
  }

  const updateBudgetItemName = (section, id, name) => {
    setBudget(prev => ({
      ...prev,
      [section]: prev[section].map(item =>
        item.id === id ? { ...item, name } : item
      ),
    }))
  }

  const addBudgetItem = (section, name = 'New Item') => {
    const id = Date.now().toString()
    const iconMap = {
      income: 'payments',
      fixedBills: 'receipt',
      food: 'lunch_dining',
      savings: 'savings',
      investing: 'bar_chart',
      funMoney: 'celebration',
    }
    setBudget(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), { id, name, icon: iconMap[section] || 'circle', planned: 0, actual: 0 }],
    }))
  }

  const removeBudgetItem = (section, id) => {
    setBudget(prev => ({
      ...prev,
      [section]: prev[section].filter(item => item.id !== id),
    }))
  }

  const updateNetWorthField = (type, field, value) => {
    setNetWorthData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: Number(value) || 0 },
    }))
  }

  const saveNetWorthSnapshot = () => {
    const snapshot = {
      date: new Date().toISOString().split('T')[0],
      netWorth,
      assets: totalAssets,
      liabilities: totalLiabilities,
    }
    setNetWorthData(prev => ({
      ...prev,
      history: [...(prev.history || []).filter(h => h.date !== snapshot.date), snapshot]
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    }))
  }

  const updateGoal = (id, field, value) => {
    setGoals(prev => prev.map(g =>
      g.id === id ? { ...g, [field]: field === 'current' || field === 'target' ? Number(value) || 0 : value } : g
    ))
  }

  const addGoal = (goal) => {
    setGoals(prev => [...prev, { ...goal, id: Date.now().toString() }])
  }

  const removeGoal = (id) => {
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  const addTransaction = (tx) => {
    setTransactions(prev => [{ ...tx, id: Date.now().toString(), date: tx.date || new Date().toISOString().split('T')[0] }, ...prev])
  }

  const removeTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id))
  }

  const nextImmediateGoal = useMemo(() =>
    goals.find(g => g.isImmediate && g.current < g.target), [goals])

  const nextGoal = useMemo(() =>
    goals.find(g => !g.isImmediate && !g.isUltimate && g.current < g.target), [goals])

  const ultimateGoal = useMemo(() =>
    goals.find(g => g.isUltimate), [goals])

  return (
    <AppContext.Provider value={{
      settings, setSettings,
      budget, setBudget,
      netWorthData, netWorth, totalAssets, totalLiabilities,
      goals, setGoals,
      transactions,
      totalIncome, totalExpenses, totalPlannedIncome, totalPlannedExpenses,
      updateBudgetItem, updateBudgetItemName, addBudgetItem, removeBudgetItem,
      updateNetWorthField, saveNetWorthSnapshot,
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
