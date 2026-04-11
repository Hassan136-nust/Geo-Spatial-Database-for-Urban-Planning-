import express from 'express';
import { getLandmarks, getLandmark, createLandmark, updateLandmark, deleteLandmark } from '../controllers/landmarkController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getLandmarks).post(protect, authorize('admin', 'planner'), createLandmark);
router.route('/:id').get(getLandmark).put(protect, authorize('admin', 'planner'), updateLandmark).delete(protect, authorize('admin'), deleteLandmark);

export default router;
