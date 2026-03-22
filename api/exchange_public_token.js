import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { public_token } = req.body;
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

  try {
    const response = await client.itemPublicTokenExchange({ public_token });
    return res.status(200).json({ status: 'success', access_token: response.data.access_token });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
