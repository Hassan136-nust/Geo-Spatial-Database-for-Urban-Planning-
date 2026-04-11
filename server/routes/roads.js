import express from 'express';
import { getRoads, getRoad, createRoad, updateRoad, deleteRoad } from '../controllers/roadController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getRoads).post(protect, authorize('admin', 'planner'), createRoad);
router.route('/:id').get(getRoad).put(protect, authorize('admin', 'planner'), updateRoad).delete(protect, authorize('admin'), deleteRoad);

export default router;
