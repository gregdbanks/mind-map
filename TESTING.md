# Stripe Integration Test Plan

## Prerequisites
- Docker running (`docker compose up -d`)
- Stripe CLI listening (`stripe listen --forward-to localhost:4001/stripe/webhook`)
- Frontend running (`npm run dev`)
- DB reset to clean state (free plan, no cloud maps)

## Test Card
- Number: `4242 4242 4242 4242`
- Expiry: `12/29`
- CVC: `123`
- Name/ZIP: anything

---

## Phase 1: Free Plan
1. Refresh dashboard — footer says "Upgrade to Pro to save maps to the cloud", no gold star
2. Create a map, go back — does NOT auto-sync, stays local
3. Click "Save to Cloud" on a map card — upgrade modal appears
4. Click "Not now" — modal dismisses, map stays local
5. "Upgrade to Pro — $5/mo" button visible in footer

## Phase 2: Subscribe
6. Click "Upgrade to Pro — $5/mo" (footer or modal) — redirects to Stripe Checkout
7. Pay with test card
8. Redirects back to dashboard with green success banner
9. Footer shows "Pro — Unlimited cloud maps and sharing"
10. Gold star on profile icon
11. "Save to Cloud" button on map cards now saves successfully

## Phase 3: Cloud Sync (Pro)
12. Save 2-3 maps to cloud — all succeed
13. Edit a synced map, go back — changes auto-sync to cloud
14. Create a new map, go back — does NOT auto-sync (must explicitly save to cloud)

## Phase 4: Manage Subscription
15. Profile icon → "Manage subscription" → Stripe Customer Portal opens
16. Close portal, return — still Pro, star still visible

## Phase 5: Cancel Subscription
17. Cancel via Stripe CLI (`stripe subscriptions cancel <sub_id>`) or portal
18. Refresh dashboard — gold star disappears
19. Footer shows "[N] cloud maps synced — Existing maps will continue to sync. Upgrade to Pro to save new maps to the cloud."
20. Edit an existing synced map, go back — still syncs (updates work)
21. Create a new map, go back — does NOT sync to cloud
22. Click "Save to Cloud" on new map — upgrade modal appears

## Phase 6: Re-subscribe
23. Click "Upgrade to Pro" again, complete checkout with test card
24. Gold star returns, can save new maps to cloud again
25. Previously synced maps still accessible

---

## DB Reset Commands

Reset user to clean free state:
```bash
docker exec thoughtnet-db psql -U thoughtnet -c "DELETE FROM maps WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; UPDATE users SET plan = 'free', stripe_customer_id = NULL WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';"
```

Check current state:
```bash
docker exec thoughtnet-db psql -U thoughtnet -c "SELECT plan, stripe_customer_id FROM users WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';"
docker exec thoughtnet-db psql -U thoughtnet -c "SELECT COUNT(*) FROM maps WHERE user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';"
```

Cancel subscription immediately via CLI:
```bash
stripe subscriptions list --customer <cus_id> --status active --api-key sk_test_...
echo "yes" | stripe subscriptions cancel <sub_id> --api-key sk_test_...
```
