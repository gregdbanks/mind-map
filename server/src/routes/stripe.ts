import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';
import * as stripeController from '../controllers/stripeController';

const router = Router();

// Webhook — NO auth (Stripe calls this), raw body handled by app.ts
router.post('/webhook', asyncHandler(async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }
  await stripeController.handleWebhook(req.body, signature);
  res.json({ received: true });
}));

// Authenticated endpoints
router.post('/create-checkout', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { priceId } = req.body;
  if (!priceId) {
    return res.status(400).json({ error: 'priceId is required' });
  }
  const result = await stripeController.createCheckoutSession(req.user!.userId, priceId);
  res.json(result);
}));

router.post('/create-portal', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const result = await stripeController.createPortalSession(req.user!.userId);
  res.json(result);
}));

router.get('/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const result = await stripeController.getStatus(req.user!.userId);
  res.json(result);
}));

export default router;
