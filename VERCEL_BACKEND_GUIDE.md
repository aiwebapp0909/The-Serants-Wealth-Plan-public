# Vercel Backend Integration Guide

## Overview

Your Plaid integration uses your **Express backend running on Vercel**, not Firebase Cloud Functions. This is the recommended approach for your architecture.

## Backend Endpoints

Your Express server (server/index.js) already has the following endpoints configured:

### 1. Create Link Token
```
POST /api/create_link_token
Content-Type: application/json

{
  "userId": "user_123"
}

Response:
{
  "link_token": "link-sandbox-...",
  "expiration": "2026-03-25T02:32:21.000Z",
  "request_id": "req_..."
}
```

### 2. Exchange Public Token
```
POST /api/exchange_public_token
Content-Type: application/json

{
  "public_token": "public-sandbox-...",
  "userId": "user_123"
}

Response:
{
  "status": "success",
  "secure_token": "encrypted_access_token_..."
}
```

### 3. Fetch Transactions
```
POST /api/transactions
Content-Type: application/json

{
  "secure_token": "encrypted_access_token_...",
  "mfa_token": "user_authenticated"
}

Response:
[
  {
    "transaction_id": "tx_123",
    "merchant_name": "SAFEWAY #123",
    "amount": 45.67,
    "date": "2026-03-22",
    "category": ["FOOD_AND_DRINK"],
    ...
  },
  ...
]
```

## Frontend Integration

### Environment Variables

Add to your `.env`:
```
VITE_API_URL=http://localhost:3001          # Development
VITE_API_URL=https://your-app.vercel.app    # Production
```

### Hook Usage

The `usePlaid()` hook handles all API communication:

```javascript
import { usePlaid } from '../hooks/usePlaidConnected'

function MyComponent() {
  const { createLinkToken, exchangePublicToken, fetchTransactions } = usePlaid()

  // 1. Create link token (shown to user)
  const token = await createLinkToken(userId)

  // 2. After user completes Plaid auth
  const { secureToken } = await exchangePublicToken(publicToken, userId)

  // 3. Fetch transactions with secure token
  const transactions = await fetchTransactions(secureToken)
}
```

## Security Features

Your backend implements enterprise-grade security:

- **AES-256 Encryption**: Access tokens encrypted before storage/transmission
- **CORS Protection**: Controlled origin access
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet.js**: Secure HTTP headers (CSP, X-Frame-Options, etc)
- **Audit Logging**: All requests logged with IP, action, timestamp
- **MFA Requirement**: Transactions endpoint requires MFA token

## Deployment

### Local Development
```bash
# Terminal 1: Backend
npm run server
# Runs on http://localhost:3001

# Terminal 2: Frontend (dev script already starts both)
npm run dev
```

### Vercel Deployment

Your backend is already configured for Vercel via `vercel.json`:

```bash
# Deploy to Vercel
vercel deploy

# Or using GitHub integration
git push origin main  # Auto-deploys via GitHub Actions
```

Update production API URL:
```
VITE_API_URL=https://your-vercel-app.vercel.app
```

## Data Flow

```
User clicks "Connect Bank"
        ↓
Frontend calls createLinkToken(userId)
        ↓
Backend POST /api/create_link_token
        ↓
Backend calls Plaid API → returns link_token
        ↓
Frontend opens Plaid Link modal
        ↓
User selects bank + authenticates
        ↓
Plaid returns public_token to frontend
        ↓
Frontend calls exchangePublicToken(public_token, userId)
        ↓
Backend POST /api/exchange_public_token
        ↓
Backend calls Plaid API → returns access_token
        ↓
Backend ENCRYPTS access_token → returns secure_token
        ↓
Frontend stores secure_token in sessionStorage
        ↓
Frontend calls fetchTransactions(secure_token)
        ↓
Backend POST /api/transactions
        ↓
Backend DECRYPTS secure_token → calls Plaid API
        ↓
Backend returns transactions
        ↓
Frontend auto-tags with categorization.js
        ↓
User sees transactions with smart categories
```

## Smart Categorization (Frontend Only)

The `categorization.js` utility runs entirely in the browser (no API calls):

```javascript
import { autoTagTransaction, suggestCategory } from '../lib/categorization'

// Auto-tag transaction
const category = autoTagTransaction("TRADER JOE'S #1234")
// Returns: "Food"

// Get suggested category with confidence
const suggestion = suggestCategory("AMAZON.COM")
// Returns: { category: "Shopping", confidence: 92 }
```

**130+ merchant keywords across 9 categories** - trained from common US merchants.

## Testing Plaid in Sandbox

Use Plaid's sandbox test credentials:

```
Username: user_good
Password: pass_good
```

Then select any bank to simulate:
- Wells Fargo, Chase, Bank of America, etc.
- Returns mock transactions
- Great for testing the full flow without real banking

## What Changed From Firebase

### Before
- ❌ Firebase Cloud Functions (requires Blaze plan)
- ❌ Cloud Runtime Config
- ❌ Firestore security rules for tokens

### After  
- ✅ Express backend (you already had)
- ✅ Environment variables (.env)
- ✅ Encrypted token storage option (you can decide)
- ✅ Single Vercel deployment

## Why This Approach is Better

1. **Cost**: No additional Firebase costs
2. **Control**: Full control over backend logic
3. **Existing Infrastructure**: Uses your already-deployed Express server
4. **Simplicity**: One deployment (Vercel) instead of two (Vercel + Firebase)
5. **Flexibility**: Easy to add more endpoints, modify behavior, etc

## File Structure

```
src/
  ├── hooks/
  │   └── usePlaidConnected.js  ← Calls backend /api/* endpoints
  ├── lib/
  │   └── categorization.js      ← Smart merchants->category mapping
  └── pages/
      └── Transactions.jsx       ← Uses Plaid + auto-categorization

server/
  └── index.js                   ← Express endpoints for Plaid

.env
  └── VITE_API_URL=...          ← Backend URL (dev/prod)
```

## Next Steps

1. **Verify `.env` has VITE_API_URL** set correctly
2. **Test locally**: `npm run dev` and visit Transactions tab
3. **Deploy**: `git push origin main` (auto-deploys to Vercel)
4. **Update production VITE_API_URL** in Vercel dashboard
5. **Test on production**: Use Plaid sandbox credentials

## Troubleshooting

### "Plaid SDK not loaded"
- Ensure Plaid script in `index.html` is loaded
- Check browser console for CORS errors

### "Failed to create link token"  
- Verify `VITE_API_URL` in `.env`
- Check backend is running: `npm run server`
- Check Plaid credentials in `server/index.js`

### "Failed to fetch transactions"
- Ensure MFA token is set in sessionStorage
- Check backend logs for decryption errors

### "CORS error in console"
- Update backend `CORS` origin in `server/index.js` to match frontend URL

---

**Status**: ✅ Ready to use Vercel backend  
**No Firebase functions needed** - all logic in Express  
**Cost**: $0-5/month (Vercel + Plaid free tier)
