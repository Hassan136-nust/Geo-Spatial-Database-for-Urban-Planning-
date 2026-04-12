import express from 'express';
import { runAnalytics, getAreaAnalytics } from '../controllers/analyticsController2.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/run', runAnalytics);
router.get('/area/:areaId', protect, getAreaAnalytics);

export default router;
