# AI Coach & Wealth Projection Setup Guide

## Overview

The app now includes three powerful AI features:

1. **💬 Coach Chat** - Interactive financial advisor based on your real spending data
2. **📊 $20M Wealth Projection** - Calculator showing if you're on track to $20M
3. **📈 Weekly Financial Reports** - Auto-generated insights (optional, for future)

---

## 1. Firebase Cloud Functions Setup

### Prerequisites
- Node.js 18+ installed
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project created and linked locally

### Step 1: Initialize Functions

If you don't have a `functions/` directory:

```bash
firebase init functions
# Choose your project
# Select JavaScript/TypeScript (JavaScript recommended)
# Select ESLint (optional)
```

### Step 2: Install Dependencies

```bash
cd functions
npm install openai firebase-admin
```

### Step 3: Add Environment Variables

Create or edit `functions/.env.local`:

```
OPENAI_API_KEY=sk-xxxxxx...
```

Get your OpenAI API key from: https://platform.openai.com/api-keys

### Step 4: Deploy Functions

The coach functions are already in `/functions/ai/coach.js`.

Deploy:

```bash
firebase deploy --only functions
```

This deploys two callable functions:
- `coachChat` - Chat with your financial coach
- `generateWeeklyReport` - Generate weekly financial reports

---

## 2. Frontend Configuration

### Environment Variables

Add to your `.env.local`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

These are auto-configured if you used Firebase init.

### Components Added

**New files:**
- `src/components/CoachChat.jsx` - Chat modal UI
- `src/components/WealthProjection.jsx` - Wealth calculator component
- `src/hooks/useCoachChat.js` - Chat state management
- `src/lib/projection.js` - Wealth projection calculations
- `functions/ai/coach.js` - Backend AI logic

**Modified files:**
- `src/pages/Dashboard.jsx` - Integrated new components
- `src/firebase.js` - Added functions export

---

## 3. Features & Usage

### Coach Chat

**When you click the "Coach Insight" card:**

1. Opens chat modal
2. Ask any financial question:
   - "How can I save more?"
   - "Am I spending too much on food?"
   - "Will I reach my $20M goal?"
   - "Should I invest more?"
   - etc.

**The coach:**
- Sees your real budget data
- Gives personalized advice
- References your actual numbers
- Stores conversation locally (not saved to DB)

**Behind the scenes:**
- Frontend fetches your budgets
- Sends question + financial context to Firebase Function
- OpenAI analyzes and responds
- Chat history kept in memory

### $20M Wealth Projection

**Dashboard card shows:**
- Projected net worth at retirement
- Progress toward $20M goal
- Years until retirement
- Interactive slider to adjust monthly investment

**Formula used:**
```
FV = P * ((1 + r)^n - 1) / r

Where:
- P = Monthly investment
- r = Monthly interest rate (10% annual = 0.833% monthly)
- n = Number of months
```

**Assumptions:**
- Retirement age: 65
- Expected return: 10% annually
- Current net worth: Your current net worth

**Key insight:**
If you're not on track, the card tells you exactly how much more to invest monthly.

### Weekly Reports (Optional - Future)

When implemented, you can trigger weekly reports showing:
- Total spending this week
- Spending by category
- 3 key insights
- 2 actionable recommendations

---

## 4. Troubleshooting

### "Function not found" Error

**Problem:** Chat doesn't work, error says function not deployed

**Solution:**
```bash
# Check if functions are deployed
firebase functions:list

# If not, deploy:
firebase deploy --only functions

# Check logs:
firebase functions:log
```

### "OpenAI API Key Invalid"

**Problem:** Chat returns error about API key

**Solution:**
1. Get new key from https://platform.openai.com/api-keys
2. Set in Firebase Console:
   - Go to Project Settings > Functions
   - Edit environment variable `OPENAI_API_KEY`
   - Redeploy

### Chat Freezes

**Problem:** Chat loading spinner never stops

**Solution:**
1. Check browser console for errors
2. Check Firebase function logs: `firebase functions:log`
3. Increase function timeout in `firebase.json`:
   ```json
   {
     "functions": {
       "timeoutSeconds": 60
     }
   }
   ```

### Projection Calculator Shows Wrong Numbers

**Problem:** Wealth projection doesn't match expectations

**Explanation:**
- Assumes 10% annual return (market average)
- Includes current net worth
- Calculates to age 65
- Uses compound interest formula

**To adjust:**
Edit `src/lib/projection.js` and change `annualRate`:
```javascript
const annualRate = 0.10  // Change 0.10 to your expected return (e.g., 0.08 for 8%)
```

---

## 5. Cost & Limits

### OpenAI API Costs

**Estimated costs:**
- Each chat: ~$0.001 - $0.005 (using gpt-4o-mini)
- At $100/month: ~1,000-5,000 chats
- Very cheap for typical usage

**Monitor usage:**
- Go to https://platform.openai.com/account/billing/overview
- Set usage limits to prevent surprises

### Firebase Function Limits

**Free tier includes:**
- 125,000 invocations/month
- First 1GB of network egress free
- Enough for this app unless you have 100+ daily active users

---

## 6. Security & Privacy

### Data Flow

```
Your budgets in Firestore (only you can access)
    ↓
Firebase Cloud Function (authenticated)
    ↓
OpenAI API (we send income/expenses, NOT spending details)
    ↓
Back to your app (stored locally, not saved)
```

### What's sent to OpenAI?

✅ Sent:
- Income/expenses summary
- Savings rate
- Message you ask

❌ NOT sent:
- Your personal info
- Category-by-category spending
- Account details
- Passwords or auth tokens

### Chat Privacy

- Chat history stored only in browser memory
- Cleared if you refresh page
- No server-side chat history
- Each month clear data older than 30 days

---

## 7. Next Steps

### To Enable Weekly Reports

1. Set up Firestore cron job (Cloud Scheduler)
2. Schedule to run every Sunday at 9am
3. Store reports in `weeklyReports/{userId}/`
4. Add report display to Dashboard

### To Add Multiple Coach Personas

Modify prompt in `functions/ai/coach.js`:
- "Aggressive investor coach"
- "Conservative advisor"
- "Debt elimination specialist"

### To Track AI Insights Over Time

Store conversations in Firestore:
```javascript
await db.collection('coachChats').add({
  userId,
  messages: conversationHistory,
  createdAt: new Date()
})
```

---

## 8. Deployment Checklist

- [ ] OpenAI API key obtained
- [ ] `functions/.env.local` set with API key
- [ ] Firebase functions deployed: `firebase deploy --only functions`
- [ ] `.env.local` in root has Firebase config
- [ ] App builds without errors: `npm run build`
- [ ] Chat modal opens when clicking "Coach Insight"
- [ ] Coach responds to messages
- [ ] Wealth projection updates with slider
- [ ] All data stays private (check Firestore rules)

---

## 9. Support & Debugging

### View Coach Function Logs

```bash
firebase functions:log
```

### Test Function Locally

```bash
firebase emulators:start
```

Then chat will use local emulator instead of production.

### Enable Verbose Logging

In `functions/ai/coach.js`, add:
```javascript
console.log('User message:', message)
console.log('Financial data:', JSON.stringify(budgetContext, null, 2))
```

---

## Questions?

- OpenAI Docs: https://platform.openai.com/docs
- Firebase Docs: https://firebase.google.com/docs
- Chat function specs: See `functions/ai/coach.js`
