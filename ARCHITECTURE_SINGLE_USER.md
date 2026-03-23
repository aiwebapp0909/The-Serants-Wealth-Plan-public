# Serant Wealth Plan - Single-User Architecture

## Core Principle
**ONE Google account = ONE financial system**

All data belongs to `userId`. Data persists forever (until manually deleted). Logging out does NOT delete or reset anything.

---

## 1. Authentication System

### Google Sign-In (Firebase Auth)
```javascript
const userId = user.uid  // Primary key for everything
```

**Flow:**
1. User clicks "Sign in with Google"
2. Firebase handles authentication
3. `userId` extracted from `user.uid`
4. User profile created automatically in `users/{userId}`
5. App fetches all user data by `userId`

---

## 2. Database Structure

### Collections & Schema

#### `users/{userId}`
```javascript
{
  userId: "user-id-123",
  email: "user@example.com",
  name: "John Doe",
  photoURL: "...",
  createdAt: "2026-03-22T..."
}
```

#### `budgets/{budgetId}` where `budgetId = "${userId}_${month}"`
```javascript
{
  budgetId: "user-id-123_2026-03",
  userId: "user-id-123",
  month: "2026-03",
  
  // Budget sections
  categories: {
    income: [
      { id, name, icon, planned, actual }
    ],
    fixedBills: [...],
    food: [...],
    savings: [...],
    investing: [...],
    funMoney: [...]
  },
  
  // Totals (calculated on client)
  totals: {
    income: 5000,
    expenses: 2000,
    savings: 1500,
    investing: 1000,
    remaining: 500
  },
  
  createdAt: "2026-03-01T...",
  updatedAt: "2026-03-22T..."
}
```

#### `userData/{userId}`
```javascript
{
  userId: "user-id-123",
  
  goals: [
    {
      id, name, target, current, phase, 
      isImmediate, isUltimate, description
    }
  ],
  
  transactions: [
    { id, userId, amount, category, date, source }
  ],
  
  netWorthData: {
    assets: { cash, investments, realEstate, vehicles, other },
    liabilities: { creditCards, loans, mortgage, otherDebt },
    history: [{ date, netWorth }]
  }
}
```

#### `netWorthSnapshots/{snapshotId}`
```javascript
{
  snapshotId: "uuid",
  userId: "user-id-123",
  date: "2026-03-22",
  netWorth: 150000,
  createdAt: "2026-03-22T..."
}
```

#### `insights/{userId}`
```javascript
{
  userId: "user-id-123",
  insights: [
    { text: "...", generatedAt: "..." }
  ],
  lastUpdated: "2026-03-22T..."
}
```

---

## 3. Data Persistence (Critical)

### Rule: Data is ALWAYS fetched by userId

**Example:**
```javascript
const budgets = query(
  collection(db, "budgets"),
  where("userId", "==", userId)
);
```

**Guarantees:**
- ✅ Data stays forever
- ✅ Same data loads every login
- ✅ No duplication
- ✅ No cross-user contamination

---

## 4. Month System

### Format
```
YYYY-MM  (e.g., 2026-03)
```

### Behavior: On App Load
```
currentMonth = getMonthKey()  // "2026-03"

if (budgets[currentMonth] exists) {
  continue with existing budget
} else {
  create new budget with defaults
  optionally copy previous month as template
}
```

---

## 5. Auto-Save System

### Implementation
```javascript
// Every edit → debounced save
useEffect(() => {
  const timeout = setTimeout(() => {
    setDoc(doc(db, "budgets", budgetId), data, { merge: true })
  }, 800)
  
  return () => clearTimeout(timeout)
}, [budget])
```

**Key Points:**
- ❌ No "Save" button
- ✅ Always synced to database
- ✅ 800ms debounce = efficient writes
- ✅ Merge updates = no overwrites

---

## 6. Real-Time Sync (Optional)

```javascript
onSnapshot(doc(db, "budgets", budgetId), (doc) => {
  setBudget(doc.data())
});
```

**Benefits:**
- Multi-device sync (if user logs in on phone + desktop)
- Live updates if Firestore is modified externally
- Instant feedback on changes

---

## 7. Security Rules (Simplified + Strong)

```firestore
match /budgets/{budgetId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == resource.data.userId;
}

match /userData/{userId} {
  allow read, write: if request.auth != null 
    && request.auth.uid == userId;
}

// Similar rules for all other collections
```

**Result:**
- ✅ Users can ONLY access their own data
- ✅ No household complexity
- ✅ Impossible to read another user's data
- ✅ Clean, enforceable rules

---

## 8. Session Behavior

### Logging Out
- Clears session
- **Does NOT delete data**
- User remains logged out until they sign in again

### Logging Back In
1. Firebase authenticates user
2. Fetch all data by userId
3. Restore full state instantly
4. Continue from where they left off

**Example:**
```
Day 1: Create budget, save $500
Day 2: Log out
Day 3: Log back in → see same $500, same budget
```

---

## 9. UX Principles

### Before (Couple Model)
- "Couple Sync" modal showing household ID
- Household passcode for sensitive data
- Data shared across household members
- Create/join household flow

### After (Single-User Model)
- "Connected to your account" badge
- Google Sign-In provides security
- Data private to authenticated user
- Automatic account creation on first login

---

## 10. App Flow

```
User Opens App
       ↓
Is user logged in? (FirebaseAuth)
       ↓
  NO  → Login Page (Google Sign-In)
  YES → Dashboard
       ↓
       Load user data by userId
       Fetch current month's budget
       Real-time listeners activate
       ↓
       User can now:
       - Edit budget
       - Track goals
       - View analytics
       - All changes auto-save
```

---

## 11. Future: Adding Couples

If you want couples/families later:

### Simple Approach (No shared budgets yet)
```javascript
// Each person has their own account
// Can share summary data via shared link
```

### Advanced Approach (Shared budgets)
```
// Add to budget doc:
sharedWith: ["partner-userId"]

// Update security rule:
allow read, write: if request.auth != null && (
  request.auth.uid == resource.data.userId ||
  request.auth.uid in resource.data.sharedWith
)

// Now both users can edit same budget
```

---

## 12. Key Differences from Previous Model

| Aspect | Before (Couple) | After (Single-User) |
|--------|-----------------|-------------------|
| Auth | Google + Household | Google only |
| Primary Key | householdId | userId |
| Data Scope | Shared | Private per user |
| Passcode | Household | N/A (Google) |
| Onboarding | Create/Join household | Auto setup |
| Logout | Clears session + household | Clears session only |
| Multi-user | Built-in | Future: sharedWith array |
| Complexity | High (households, members) | Low (just userId) |

---

## 13. Deployment Checklist

- [ ] Deploy updated Firestore rules
- [ ] Test login with new AuthContext
- [ ] Verify budget auto-save works
- [ ] Check that goals persist across sessions
- [ ] Test on multiple devices (if desired)
- [ ] Verify logout doesn't delete data
- [ ] Document for teammates

---

## 14. Error Handling

### Common Scenarios

**User A tries to access User B's budget:**
- Firestore rules reject: `request.auth.uid != resource.data.userId`
- Error logged, user sees nothing

**Offline editing:**
- AppContext holds state in memory
- On reconnect, auto-save continues
- No data loss

**Session expires:**
- User still logged in (Firebase auth)
- Re-authenticate if token expires
- Data reloads on next action

---

## Conclusion

This architecture is:
- ✅ **Simple**: One user = one ID = one database path
- ✅ **Reliable**: Data persists, no overwrites
- ✅ **Secure**: Firebase + Google + Firestore rules
- ✅ **Scalable**: Trivial to add couples later (just sharedWith array)
- ✅ **User-friendly**: Auto-save, no passcodes, seamless login
