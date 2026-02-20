import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { asyncHandler } from '../middleware/asyncHandler';
import * as mapsController from '../controllers/mapsController';

const router = Router();

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const maps = await mapsController.listMaps(req.user!.userId);
  res.json(maps);
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

export default router;
