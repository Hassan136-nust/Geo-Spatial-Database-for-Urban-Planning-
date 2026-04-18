import express from 'express';
import { getZones, getZone, createZone, updateZone, deleteZone, fetchOSMZones, saveOSMZone } from '../controllers/zoneController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public: fetch live OSM zones (must be before /:id to avoid route conflict)
router.get('/osm-fetch', fetchOSMZones);

// Save OSM zone to DB (requires auth)
router.post('/save-osm', protect, saveOSMZone);

router.route('/').get(getZones).post(protect, authorize('admin', 'planner'), createZone);
router.route('/:id').get(getZone).put(protect, authorize('admin', 'planner'), updateZone).delete(protect, authorize('admin'), deleteZone);

export default router;
