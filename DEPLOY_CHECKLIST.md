# Stripe Deployment Checklist

## Pre-Deploy (Code — already done)
- [x] Stripe backend: controller, routes, webhook handler
- [x] Plan gating: free = 0 cloud saves, pro = unlimited
- [x] Upgrade modal, pro badge, footer messaging
- [x] Test mode end-to-end verified
- [ ] Commit and push all changes, create PR to main

## Stripe Live Mode (when ready for real payments)
1. Stripe Dashboard → switch to **live mode**
2. Create "ThoughtNet Pro" product — $5/month recurring → copy live `price_xxx` ID
3. Copy live API keys: `sk_live_...`
4. Register webhook endpoint: `https://yourdomain.com/stripe/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy live `whsec_...` signing secret
5. Update production env vars:
   - `STRIPE_SECRET_KEY` → live key
   - `STRIPE_WEBHOOK_SECRET` → live webhook secret
   - `STRIPE_MONTHLY_PRICE_ID` → live price ID
   - `STRIPE_FRONTEND_URL` → production domain
6. Set **spending alert** in Stripe Dashboard ($50/month recommended)
7. Test with real $1 charge to yourself, cancel immediately via portal

## Infrastructure
- Production server must have all Stripe env vars set
- `STRIPE_FRONTEND_URL` must point to real domain (not localhost)
- `express.raw()` middleware ordering is already correct in app.ts
- Run DB migration: `server/src/db/migrations/001_add_stripe_customer_id.sql`
