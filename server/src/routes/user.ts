import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';
import * as userController from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/profile', asyncHandler(async (req, res) => {
  const profile = await userController.getProfile(req.user!.userId);
  if (!profile) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(profile);
}));

export default router;
