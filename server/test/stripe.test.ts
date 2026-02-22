import request from 'supertest';
import { app } from '../src/app';

describe('Stripe API', () => {
  describe('GET /stripe/status', () => {
    it('returns plan status for authenticated user', async () => {
      const res = await request(app).get('/stripe/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('plan', 'free');
      expect(res.body).toHaveProperty('mapCount');
      expect(res.body).toHaveProperty('mapLimit', 3);
      expect(res.body).toHaveProperty('hasStripeCustomer', false);
      expect(res.body).toHaveProperty('monthlyPriceId');
      expect(res.body).toHaveProperty('annualPriceId', '');
    });
  });

  describe('POST /stripe/create-checkout', () => {
    it('rejects missing priceId', async () => {
      const res = await request(app)
        .post('/stripe/create-checkout')
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('priceId is required');
    });

    it('rejects invalid priceId', async () => {
      const res = await request(app)
        .post('/stripe/create-checkout')
        .send({ priceId: 'price_fake_invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /stripe/create-portal', () => {
    it('returns error when user has no stripe customer', async () => {
      const res = await request(app)
        .post('/stripe/create-portal')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /stripe/webhook', () => {
    it('rejects missing signature', async () => {
      const res = await request(app)
        .post('/stripe/webhook')
        .set('Content-Type', 'application/json')
        .send('{}');
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Missing stripe-signature header');
    });
  });
});
