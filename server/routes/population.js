import express from 'express';
import { getPopulationData, getPopulationByZone, createPopulationData, updatePopulationData, deletePopulationData } from '../controllers/populationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getPopulationData).post(protect, authorize('admin', 'planner'), createPopulationData);
router.get('/zone/:zoneId', getPopulationByZone);
router.route('/:id').put(protect, authorize('admin', 'planner'), updatePopulationData).delete(protect, authorize('admin'), deletePopulationData);

export default router;
