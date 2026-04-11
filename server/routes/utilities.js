import express from 'express';
import { getUtilities, getUtility, createUtility, updateUtility, deleteUtility } from '../controllers/utilityController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.route('/').get(getUtilities).post(protect, authorize('admin', 'planner'), createUtility);
router.route('/:id').get(getUtility).put(protect, authorize('admin', 'planner'), updateUtility).delete(protect, authorize('admin'), deleteUtility);

export default router;
