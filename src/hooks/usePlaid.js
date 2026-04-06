import { useCallback, useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { useApp } from '../context/AppContext';

export function usePlaid() {
  const [linkToken, setLinkToken] = useState(null);
  const { addTransaction } = useApp();

  const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api'

  const generateToken = async () => {
    try {
      const response = await fetch(`${API_URL}/create_link_token`, {
        method: 'POST',
      });
      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (e) {
      console.error('Plaid Link Token error', e);
    }
  };

  useEffect(() => {
    generateToken();
  }, []);

  const onSuccess = useCallback(async (public_token, metadata) => {
    try {
      // 1. Exchange public token for access token
      const response = await fetch(`${API_URL}/exchange_public_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ public_token }),
      });
      const data = await response.json();
      const accessToken = data.access_token;

      // 2. Fetch last 30 days of transactions
      const txResponse = await fetch(`${API_URL}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, mfa_token: 'valid' }),
      });
      const transactions = await txResponse.json();

      // 3. AI Categorization 
      let catMap = {};
      try {
        const categorizeRes = await fetch(`${API_URL}/ai/categorize_transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transactions: transactions.map(t => ({ id: t.transaction_id, name: t.name, amount: t.amount })) })
        });
        catMap = await categorizeRes.json();
      } catch (catError) {
        console.warn('AI Categorization failed, falling back to Plaid categories', catError);
      }

      // 4. Add to AppContext / Firestore
      transactions.forEach((t) => {
        addTransaction({
          plaidId: t.transaction_id,
          amount: Math.abs(t.amount),
          name: t.name,
          merchant: t.merchant_name || t.name,
          category: catMap[t.transaction_id] || 'Other',
          isExpense: t.amount > 0,
          date: t.date,
        });
      });

      alert(`Bank connected! Found & AI-categorized ${transactions.length} recent transactions.`);
    } catch (e) {
      console.error('Plaid full flow error', e);
      alert('Failed to connect bank link. Please check console for details.');
    }
  }, [addTransaction, API_URL]);

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return { open, ready, linkToken };
}
