import 'dotenv/config';
import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import * as admin from 'firebase-admin';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const app = express();

// --- FIREBASE ADMIN INITIALIZATION ---
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    credential: admin.credential.cert({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk@' + process.env.VITE_FIREBASE_PROJECT_ID + '.iam.gserviceaccount.com',
      privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
    })
  });
}
const db = admin.firestore();

// --- FINTECH SECURITY LAYER ---
app.use(helmet()); // Secure HTTP Headers
app.use(express.json({ limit: '10kb' })); // Anti-Payload-Bomb
app.use(cors({
  origin: process.env.CLIENT_URL || '*', // Restrict to production URL in .env
  credentials: true
}));

// Rate Limiting (Brute Force Protection)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100, // 100 reqs per IP
  message: { error: 'Too many requests. Security lockout active.' }
});
app.use('/api/', apiLimiter);

// Encryption Utility (AES-256)
const ENCRYPTION_KEY = process.env.PLAID_ENCRYPTION_KEY || 'too-secret-to-be-true-32-chars-long-123'; 
const IV_LENGTH = 16; 

function encrypt(text) {
  let iv = crypto.randomBytes(IV_LENGTH);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  let textParts = text.split(':');
  let iv = Buffer.from(textParts.shift(), 'hex');
  let encryptedText = Buffer.from(textParts.join(':'), 'hex');
  let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// Audit Log Middleware
const auditLogger = (action) => (req, res, next) => {
  const log = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    action,
    userId: req.headers['x-user-id'] || 'anonymous',
    userAgent: req.get('User-Agent')
  };
  console.log(`[AUDIT] ${JSON.stringify(log)}`);
  next();
};

// Plaid Configuration
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});
const client = new PlaidApi(configuration);

// --- ENDPOINTS ---

app.post('/api/create_link_token', auditLogger('CREATE_LINK_TOKEN'), async (req, res) => {
  const { userId } = req.body;
  if (!userId || typeof userId !== 'string') return res.status(400).json({ error: 'Invalid ID' });

  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: userId },
      client_name: 'Serant Wealth Plan',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Security: Handshake Failed' });
  }
});

app.post('/api/exchange_public_token', auditLogger('EXCHANGE_TOKEN'), async (req, res) => {
  const { public_token, userId } = req.body;
  if (!public_token || !userId) return res.status(400).json({ error: 'Missing metadata' });

  try {
    const response = await client.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;
    
    // Fintech Grade: Encrypt the token before any database storage or transport
    const secure_token = encrypt(access_token);
    
    res.json({ status: 'success', secure_token });
  } catch (error) {
    res.status(500).json({ error: 'Exchange Failed' });
  }
});

app.post('/api/transactions', auditLogger('FETCH_BANK_DATA'), async (req, res) => {
  const { secure_token, mfa_token } = req.body;
  
  // Requirement: Multi-Layer Authorization check
  if (!mfa_token) return res.status(403).json({ error: 'MFA REQUIRED' });

  try {
    // Decrypt on the fly just for the Plaid call
    const access_token = decrypt(secure_token);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().split('T')[0];

    const response = await client.transactionsGet({
      access_token,
      start_date: formatDate(thirtyDaysAgo),
      end_date: formatDate(now),
    });
    res.json(response.data.transactions);
  } catch (error) {
    res.status(500).json({ error: 'Secure Fetch Failed' });
  }
});

// Sync transactions to Firestore for persistence and analytics
app.post('/api/sync_transactions', auditLogger('SYNC_TO_FIRESTORE'), async (req, res) => {
  const { secure_token, userId } = req.body;

  if (!secure_token || !userId) {
    return res.status(400).json({ error: 'Missing secure_token or userId' });
  }

  try {
    const access_token = decrypt(secure_token);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().split('T')[0];

    // Fetch from Plaid
    const response = await client.transactionsGet({
      access_token,
      start_date: formatDate(thirtyDaysAgo),
      end_date: formatDate(now),
    });

    const transactions = response.data.transactions;
    const batch = db.batch();
    let syncCount = 0;

    // Save each transaction to Firestore
    for (const tx of transactions) {
      const txRef = db.collection('transactions').doc(tx.transaction_id);
      
      batch.set(txRef, {
        plaidId: tx.transaction_id,
        userId,
        date: tx.date,
        amount: Math.abs(tx.amount),
        merchant: tx.merchant_name || tx.name,
        merchantId: tx.merchant_name || null,
        category: tx.personal_finance_category?.primary || 'UNCATEGORIZED',
        categoryDetail: tx.personal_finance_category?.detailed || null,
        name: tx.name,
        isExpense: tx.amount > 0,
        pending: tx.pending,
        plaidData: {
          accountId: tx.account_id,
          counterparties: tx.counterparties,
          logoUrl: tx.logo_url,
          website: tx.website,
        },
        syncedAt: new Date().toISOString(),
      }, { merge: true });

      syncCount++;
    }

    // Commit batch
    if (syncCount > 0) {
      await batch.commit();
    }

    res.json({
      status: 'success',
      syncedTransactions: syncCount,
      message: `Synced ${syncCount} transactions to Firestore`
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Transaction sync failed', details: error.message });
  }
});

// --- AI STRATEGIST ENDPOINT ---
app.post('/api/ai/strategist', auditLogger('AI_STRATEGIST'), async (req, res) => {
  const { message, financialData } = req.body;
  if (!message) return res.status(400).json({ error: 'Missing message' });

  const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: 'AI not configured' });

  try {
    const systemPrompt = `You are a world-class financial strategist for the "Serants Wealth Plan".
Your job is to analyze the user's financial data and generate actionable plans.

ALWAYS respond in this EXACT format with two sections separated by "---ACTIONS---":

SECTION 1 (Human Plan):
A well-formatted financial plan using emojis and clear sections. Include:
- Monthly budget overview
- Weekly execution plan
- Key recommendations

SECTION 2 (Machine Actions):
After the separator "---ACTIONS---", provide a valid JSON array of actions.
Each action must be one of these types:

1. UPDATE_CATEGORY - Update a budget category's planned amount
   { "type": "UPDATE_CATEGORY", "section": "fixedBills|food|savings|investing|funMoney|income", "name": "Category Name", "field": "planned", "value": 500 }

2. CREATE_CATEGORY - Create a new budget category  
   { "type": "CREATE_CATEGORY", "section": "savings|investing|funMoney|fixedBills|food|income", "name": "New Category Name" }

3. UPDATE_GOAL - Update a goal's current amount
   { "type": "UPDATE_GOAL", "goalName": "Goal Name", "currentAmount": 5000 }

If no actions are needed, return an empty array: []

USER DATA:
${JSON.stringify(financialData || {}, null, 2)}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://serantwealthplan.com',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5-exp',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errData = await response.text();
      console.error('AI API error:', errData);
      return res.status(500).json({ error: 'AI request failed' });
    }

    const data = await response.json();
    const fullResponse = data.choices?.[0]?.message?.content || '';

    // Parse the response into humanPlan and actions
    let humanPlan = fullResponse;
    let actions = [];

    if (fullResponse.includes('---ACTIONS---')) {
      const parts = fullResponse.split('---ACTIONS---');
      humanPlan = parts[0].trim();
      try {
        const jsonStr = parts[1].trim().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        actions = JSON.parse(jsonStr);
        if (!Array.isArray(actions)) actions = [];
      } catch (parseErr) {
        console.warn('Failed to parse AI actions JSON:', parseErr.message);
        actions = [];
      }
    }

    res.json({ humanPlan, actions, raw: fullResponse });
  } catch (error) {
    console.error('AI Strategist error:', error);
    res.status(500).json({ error: 'AI Strategist failed' });
  }
});

// --- AI CATEGORIZE ENDPOINT ---
app.post('/api/ai/categorize_transactions', auditLogger('AI_CATEGORIZE'), async (req, res) => {
  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions)) return res.status(400).json({ error: 'Missing transactions' });

  const OPENAI_KEY = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!OPENAI_KEY) return res.status(500).json({ error: 'AI not configured' });

  if (transactions.length === 0) return res.json({});

  // Limit batch size to protect tokens
  const batch = transactions.slice(0, 100);

  try {
    const categories = ['Income', 'Housing', 'Bills & Utilities', 'Food & Dining', 'Transportation', 'Insurance', 'Subscriptions', 'Shopping', 'Entertainment', 'Healthcare', 'Savings', 'Investing', 'Other'];
    
    const systemPrompt = `You are a financial categorizer. Categorize the given list of transactions into EXACTLY one of these exact categories:
${categories.join(', ')}

Return ONLY a valid JSON object map where keys are the transaction IDs and values are the exact category names. Do not include markdown backticks like \`\`\`json. Return bare JSON.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://serantwealthplan.com',
      },
      body: JSON.stringify({
        model: 'google/gemini-pro-1.5-exp',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(batch) }
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) throw new Error('AI categorize failed');

    const data = await response.json();
    const fullResponse = data.choices?.[0]?.message?.content || '{}';
    
    let catMap = {};
    try {
      catMap = JSON.parse(fullResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch (parseErr) {
      console.warn('Failed to parse AI categorize JSON:', parseErr.message);
    }

    res.json(catMap);
  } catch (error) {
    console.error('AI Categorizer error:', error);
    res.status(500).json({ error: 'AI Categorizer failed' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`🔒 SECURE Plaid server running on port ${PORT}`));
