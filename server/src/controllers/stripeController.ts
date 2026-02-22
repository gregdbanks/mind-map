import Stripe from 'stripe';
import pool from '../db/pool';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-01-28.clover',
});

const MONTHLY_PRICE_ID = process.env.STRIPE_MONTHLY_PRICE_ID || '';
const FRONTEND_URL = process.env.STRIPE_FRONTEND_URL || 'http://localhost:5173';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

export async function createCheckoutSession(userId: string, priceId: string) {
  // Only allow the configured price ID — reject anything else
  if (priceId !== MONTHLY_PRICE_ID) {
    const err = new Error('Invalid price ID') as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  // Get user info
  const { rows } = await pool.query(
    'SELECT stripe_customer_id, email FROM users WHERE id = $1',
    [userId]
  );
  if (rows.length === 0) {
    const err = new Error('User not found') as Error & { statusCode?: number };
    err.statusCode = 404;
    throw err;
  }

  let stripeCustomerId = rows[0].stripe_customer_id;

  // Create Stripe customer if needed
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: rows[0].email,
      metadata: { userId },
    });
    stripeCustomerId = customer.id;

    await pool.query(
      'UPDATE users SET stripe_customer_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [stripeCustomerId, userId]
    );
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${FRONTEND_URL}/?checkout=success`,
    cancel_url: `${FRONTEND_URL}/`,
    subscription_data: {
      metadata: { userId },
    },
  });

  return { url: session.url };
}

export async function createPortalSession(userId: string) {
  const { rows } = await pool.query(
    'SELECT stripe_customer_id FROM users WHERE id = $1',
    [userId]
  );

  if (rows.length === 0 || !rows[0].stripe_customer_id) {
    const err = new Error('No active subscription found') as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: rows[0].stripe_customer_id,
    return_url: `${FRONTEND_URL}/`,
  });

  return { url: session.url };
}

export async function getStatus(userId: string) {
  const { rows: userRows } = await pool.query(
    'SELECT plan, stripe_customer_id FROM users WHERE id = $1',
    [userId]
  );

  if (userRows.length === 0) {
    const err = new Error('User not found') as Error & { statusCode?: number };
    err.statusCode = 404;
    throw err;
  }

  const { rows: countRows } = await pool.query(
    'SELECT COUNT(*) FROM maps WHERE user_id = $1',
    [userId]
  );

  const plan = userRows[0].plan;

  return {
    plan,
    mapCount: parseInt(countRows[0].count, 10),
    mapLimit: plan === 'pro' ? null : 0,
    hasStripeCustomer: !!userRows[0].stripe_customer_id,
    monthlyPriceId: MONTHLY_PRICE_ID,
    annualPriceId: '',
  };
}

export async function handleWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.customer) {
        await pool.query(
          "UPDATE users SET plan = 'pro', updated_at = CURRENT_TIMESTAMP WHERE stripe_customer_id = $1",
          [session.customer]
        );
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const status = subscription.status;
      const newPlan = (status === 'active' || status === 'trialing') ? 'pro' : 'free';
      if (subscription.customer) {
        await pool.query(
          'UPDATE users SET plan = $1, updated_at = CURRENT_TIMESTAMP WHERE stripe_customer_id = $2',
          [newPlan, subscription.customer]
        );
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      if (subscription.customer) {
        await pool.query(
          "UPDATE users SET plan = 'free', updated_at = CURRENT_TIMESTAMP WHERE stripe_customer_id = $1",
          [subscription.customer]
        );
      }
      break;
    }

    default:
      // Unhandled event — acknowledge silently
      break;
  }
}
