/**
 * Data Manager
 * Handles persistent data storage, cleanup, and retention for Serant Wealth Plan
 * 
 * Core Principle: userId = permanent identity
 * All data indexed by userId for multi-user support in future
 */

import {
  collection, query, where, getDocs, orderBy, deleteDoc, doc, setDoc,
  updateDoc, writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'

/**
 * Get current month in YYYY-MM format
 */
export function getCurrentMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Get date N months ago in YYYY-MM format
 */
export function getMonthsAgo(months) {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/**
 * AUTO-CLEANUP: Keep only last 12 months of budgets
 * Runs on app startup to clean up old data
 */
export async function cleanupOldBudgets(userId) {
  if (!userId || !db) return

  try {
    const q = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      orderBy('month', 'asc')
    )

    const snapshot = await getDocs(q)
    const docs = snapshot.docs

    // Keep only last 12 months
    if (docs.length <= 12) return

    const toDelete = docs.slice(0, docs.length - 12)
    const batch = writeBatch(db)

    toDelete.forEach(doc => batch.delete(doc.ref))

    await batch.commit()
    console.log(`✅ Cleaned up ${toDelete.length} old budget records`)
  } catch (error) {
    console.warn('Budget cleanup warning (non-critical):', error.message)
  }
}

/**
 * AUTO-CLEANUP: Keep only last 365 net worth snapshots (1 year)
 */
export async function cleanupOldNetWorthSnapshots(userId) {
  if (!userId || !db) return

  try {
    const q = query(
      collection(db, 'netWorthSnapshots'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    )

    const snapshot = await getDocs(q)
    const docs = snapshot.docs

    // Keep only last 365 entries
    if (docs.length <= 365) return

    const toDelete = docs.slice(0, docs.length - 365)
    const batch = writeBatch(db)

    toDelete.forEach(doc => batch.delete(doc.ref))

    await batch.commit()
    console.log(`✅ Cleaned up ${toDelete.length} old net worth snapshots`)
  } catch (error) {
    console.warn('Net worth cleanup warning (non-critical):', error.message)
  }
}

/**
 * AUTO-CLEANUP: Keep only last 12 months of transactions
 * (Optional - can keep all if using Firestore free tier)
 */
export async function cleanupOldTransactions(userId, keepMonths = 12) {
  if (!userId || !db) return

  try {
    const cutoffDate = getMonthsAgo(keepMonths)
    
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', userId)
    )

    const snapshot = await getDocs(q)
    const toDelete = snapshot.docs.filter(doc => {
      const dateStr = doc.data().date
      return dateStr && dateStr < cutoffDate
    })

    if (toDelete.length === 0) return

    const batch = writeBatch(db)
    toDelete.forEach(doc => batch.delete(doc.ref))
    await batch.commit()

    console.log(`✅ Cleaned up ${toDelete.length} old transactions (> ${keepMonths} months)`)
  } catch (error) {
    console.warn('Transaction cleanup warning (non-critical):', error.message)
  }
}

/**
 * LOAD ALL HISTORICAL DATA
 * Called on app startup to restore all past budgets, net worth history, etc.
 */
export async function loadHistoricalData(userId) {
  if (!userId || !db) return {}

  try {
    // Load all budgets (last 12 months)
    const budgetsQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', userId)
    )
    const budgetsSnapshot = await getDocs(budgetsQuery)
    const budgetsMap = {}
    budgetsSnapshot.docs.forEach(doc => {
      budgetsMap[doc.data().month] = doc.data()
    })

    // Load all net worth snapshots
    const nwQuery = query(
      collection(db, 'netWorthSnapshots'),
      where('userId', '==', userId),
      orderBy('date', 'asc')
    )
    const nwSnapshot = await getDocs(nwQuery)
    const netWorthHistory = nwSnapshot.docs.map(doc => doc.data())

    // Load all transactions
    const txQuery = query(
      collection(db, 'transactions'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    )
    const txSnapshot = await getDocs(txQuery)
    const transactions = txSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }))

    return {
      budgetsMap,
      netWorthHistory,
      transactions
    }
  } catch (error) {
    console.warn('Historical data load warning:', error.message)
    return { budgetsMap: {}, netWorthHistory: [], transactions: [] }
  }
}

/**
 * ADD NET WORTH SNAPSHOT
 * Called when net worth changes to create historical record
 */
export async function addNetWorthSnapshot(userId, netWorth) {
  if (!userId || !db) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const snapshotRef = doc(collection(db, 'netWorthSnapshots'))

    await setDoc(snapshotRef, {
      userId,
      netWorth: Number(netWorth),
      date: today,
      timestamp: new Date().toISOString()
    })

    console.log(`✅ Net worth snapshot saved: ${netWorth}`)
  } catch (error) {
    console.warn('Net worth snapshot warning:', error.message)
  }
}

/**
 * INITIALIZE NEW MONTH BUDGET
 * Called when the month changes to create new budget from previous month
 */
export async function initializeNewMonth(userId, previousBudget) {
  if (!userId || !db) return

  try {
    const newMonth = getCurrentMonth()
    const budgetId = `${userId}_${newMonth}`
    const budgetRef = doc(db, 'budgets', budgetId)

    // Check if it already exists
    const checkQuery = query(
      collection(db, 'budgets'),
      where('userId', '==', userId),
      where('month', '==', newMonth)
    )
    const existing = await getDocs(checkQuery)

    if (existing.size > 0) {
      console.log(`✅ Budget for ${newMonth} already exists`)
      return
    }

    // Create new budget from previous month (reset actual values)
    const newBudget = JSON.parse(JSON.stringify(previousBudget))
    
    // Reset all actual values to 0 but keep planned
    Object.keys(newBudget).forEach(section => {
      if (Array.isArray(newBudget[section])) {
        newBudget[section] = newBudget[section].map(item => ({
          ...item,
          actual: 0
        }))
      }
    })

    newBudget.userId = userId
    newBudget.month = newMonth
    newBudget.createdAt = new Date().toISOString()

    await setDoc(budgetRef, newBudget)
    console.log(`✅ New month budget initialized: ${newMonth}`)
  } catch (error) {
    console.warn('Initialize month warning:', error.message)
  }
}

/**
 * AUTO-RUN CLEANUP TASKS
 * Call this on app startup to clean up old data
 */
export async function runMaintenanceTasks(userId) {
  if (!userId) return

  console.log('🔧 Running data maintenance tasks...')
  await Promise.all([
    cleanupOldBudgets(userId),
    cleanupOldNetWorthSnapshots(userId),
    cleanupOldTransactions(userId, 12)
  ])
  console.log('✅ Maintenance complete')
}

/**
 * BATCH SAVE MULTIPLE ITEMS
 * For efficient saving of multiple doc updates at once
 */
export async function batchSaveData(userId, updates = {}) {
  if (!userId || !db || Object.keys(updates).length === 0) return

  try {
    const batch = writeBatch(db)

    // updates format: { collection: { docId: data, ... }, ... }
    Object.entries(updates).forEach(([collectionName, docs]) => {
      Object.entries(docs).forEach(([docId, data]) => {
        const docRef = doc(db, collectionName, docId)
        batch.set(docRef, { ...data, userId }, { merge: true })
      })
    })

    await batch.commit()
    console.log('✅ Batch save completed')
  } catch (error) {
    console.warn('Batch save warning:', error.message)
  }
}
