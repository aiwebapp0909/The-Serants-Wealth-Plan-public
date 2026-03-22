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
        body: JSON.stringify({ access_token: accessToken }),
      });
      const transactions = await txResponse.json();

      // 3. Add to AppContext / Firestore
      transactions.forEach((t) => {
        addTransaction({
          amount: Math.abs(t.amount), // Apps usually track everything as positive amount, categories handle sign
          description: t.name,
          category: t.category[0] || 'Food',
          date: t.date,
        });
      });

      alert(`Bank connected! Found ${transactions.length} recent transactions.`);
    } catch (e) {
      console.error('Plaid full flow error', e);
    }
  }, [addTransaction]);

  const config = {
    token: linkToken,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return { open, ready, linkToken };
}
