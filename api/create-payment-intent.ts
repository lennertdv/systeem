import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  console.log(`Incoming request: ${req.method} ${req.url}`);

  // Add CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!stripeSecretKey) {
    console.error('STRIPE_SECRET_KEY is missing');
    return res.status(500).json({ 
      error: 'Stripe configuration error: Secret key is missing on the server.' 
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16' as any,
  });

  if (req.method === 'GET') {
    return res.status(200).json({ 
      message: 'Payment API is active. Use POST to create a payment intent.',
      env_check: {
        has_secret_key: !!process.env.STRIPE_SECRET_KEY,
        node_env: process.env.NODE_ENV
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, currency = 'usd' } = req.body;

    if (amount === undefined || amount === null || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid or missing amount' });
    }

    // Ensure amount is at least 50 cents (Stripe minimum)
    const amountInCents = Math.round(amount * 100);
    if (amountInCents < 50) {
      return res.status(400).json({ error: 'Amount must be at least $0.50' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    if (!paymentIntent.client_secret) {
      throw new Error('Stripe failed to generate a client secret');
    }

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Stripe PaymentIntent error:', error);
    res.status(500).json({ 
      error: error.message || 'An error occurred while creating the payment intent.' 
    });
  }
}
