import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';
import * as mapsController from '../controllers/mapsController';
import * as sharingController from '../controllers/sharingController';
import { getStatus } from '../controllers/stripeController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const [maps, status] = await Promise.all([
    mapsController.listMaps(req.user!.userId),
    getStatus(req.user!.userId),
  ]);
  res.json({
    maps,
    plan: status.plan,
    mapCount: status.mapCount,
    mapLimit: status.mapLimit,
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const map = await mapsController.getMap(req.params.id, req.user!.userId);
  if (!map) {
    return res.status(404).json({ error: 'Map not found' });
  }
  res.json(map);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { title, data, id } = req.body;
  if (!title || !data) {
    return res.status(400).json({ error: 'title and data are required' });
  }

  // Enforce free plan map limit
  const status = await getStatus(req.user!.userId);
  if (status.mapLimit !== null && status.mapCount >= status.mapLimit) {
    return res.status(403).json({ error: 'Map limit reached. Upgrade to Pro for unlimited maps.' });
  }

  const map = await mapsController.createMap({ id, title, data }, req.user!.userId);
  res.status(201).json(map);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const { title, data } = req.body;
  if (title === undefined && data === undefined) {
    return res.status(400).json({ error: 'title or data is required' });
  }
  const map = await mapsController.updateMap(req.params.id, { title, data }, req.user!.userId);
  if (!map) {
    return res.status(404).json({ error: 'Map not found' });
  }
  res.json(map);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const deleted = await mapsController.deleteMap(req.params.id, req.user!.userId);
  if (!deleted) {
    return res.status(404).json({ error: 'Map not found' });
  }
  res.status(204).send();
}));

// Sharing endpoints
router.get('/:id/share', asyncHandler(async (req, res) => {
  const status = await sharingController.getShareStatus(req.params.id, req.user!.userId);
  if (!status) {
    return res.status(404).json({ error: 'Map not found' });
  }
  res.json(status);
}));

router.post('/:id/share', asyncHandler(async (req, res) => {
  const result = await sharingController.shareMap(req.params.id, req.user!.userId);
  if (!result) {
    return res.status(404).json({ error: 'Map not found' });
  }
  res.json(result);
}));

router.delete('/:id/share', asyncHandler(async (req, res) => {
  const unshared = await sharingController.unshareMap(req.params.id, req.user!.userId);
  if (!unshared) {
    return res.status(404).json({ error: 'Map not found' });
  }
  res.status(204).send();
}));

export default router;
