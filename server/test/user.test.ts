import request from 'supertest';
import { app } from '../src/app';

describe('User API', () => {
  it('GET /api/user/profile - returns user profile', async () => {
    const res = await request(app).get('/api/user/profile');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('email');
    expect(res.body).toHaveProperty('username');
    expect(res.body).toHaveProperty('plan');
    expect(res.body.plan).toBe('free');
  });
});
