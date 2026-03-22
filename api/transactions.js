import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { access_token } = req.body;
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
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const formatDate = (date) => date.toISOString().split('T')[0];

  try {
    const response = await client.transactionsGet({
      access_token,
      start_date: formatDate(thirtyDaysAgo),
      end_date: formatDate(now),
    });
    return res.status(200).json(response.data.transactions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
