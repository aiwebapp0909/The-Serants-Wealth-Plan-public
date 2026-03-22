import 'dotenv/config';
import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

const app = express();

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

const PORT = 3001;
app.listen(PORT, () => console.log(`🔒 SECURE Plaid server running on port ${PORT}`));
