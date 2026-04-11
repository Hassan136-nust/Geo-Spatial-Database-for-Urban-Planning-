import express from 'express';
import { getZones, getZone, createZone, updateZone, deleteZone } from '../controllers/zoneController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getZones).post(protect, authorize('admin', 'planner'), createZone);
router.route('/:id').get(getZone).put(protect, authorize('admin', 'planner'), updateZone).delete(protect, authorize('admin'), deleteZone);

export default router;
