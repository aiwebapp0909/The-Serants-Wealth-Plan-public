import 'dotenv/config';
import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

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

app.post('/api/create_link_token', async (req, res) => {
  try {
    const response = await client.linkTokenCreate({
      user: { client_user_id: 'user-id' },
      client_name: 'Serants Wealth Plan',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error creating link token:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failure' });
  }
});

app.post('/api/exchange_public_token', async (req, res) => {
  const { public_token } = req.body;
  try {
    const response = await client.itemPublicTokenExchange({ public_token });
    const access_token = response.data.access_token;
    res.json({ status: 'success', access_token });
  } catch (error) {
    console.error('Error exchanging token:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failure' });
  }
});

app.post('/api/transactions', async (req, res) => {
  const { access_token } = req.body;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const formatDate = (date) => date.toISOString().split('T')[0];

  try {
    const response = await client.transactionsGet({
      access_token,
      start_date: formatDate(thirtyDaysAgo),
      end_date: formatDate(now),
    });
    res.json(response.data.transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error.response ? error.response.data : error.message);
    res.status(500).json({ error: 'Failure' });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Plaid server running on port ${PORT}`));
