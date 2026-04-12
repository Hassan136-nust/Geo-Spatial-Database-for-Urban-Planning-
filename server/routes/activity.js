import express from 'express';
import { getActivityFeed, getActivityStats } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getActivityFeed);
router.get('/stats', getActivityStats);

export default router;
