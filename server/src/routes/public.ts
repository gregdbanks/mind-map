import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import * as sharingController from '../controllers/sharingController';

const router = Router();

// Public route — no authentication required
router.get('/maps/:shareToken', asyncHandler(async (req, res) => {
  const map = await sharingController.getPublicMap(req.params.shareToken);
  if (!map) {
    return res.status(404).json({ error: 'Map not found or no longer shared' });
  }
  res.json(map);
}));

export default router;
