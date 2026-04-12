import express from 'express';
import { createLayer, getLayers, getPublicLayers, getLayer, updateLayer, addFeatures, deleteLayer } from '../controllers/mapLayerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/public', getPublicLayers);
router.use(protect);

router.post('/', createLayer);
router.get('/', getLayers);
router.get('/:id', getLayer);
router.put('/:id', updateLayer);
router.put('/:id/features', addFeatures);
router.delete('/:id', deleteLayer);

export default router;
