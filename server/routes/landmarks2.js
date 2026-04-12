import express from 'express';
import { fetchLandmarks, addCustomLandmark, getLandmarksByCity, saveLandmarksBulk } from '../controllers/landmarksController2.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/fetch', optionalAuth, fetchLandmarks);
router.post('/save-bulk', optionalAuth, saveLandmarksBulk);
router.post('/add', protect, addCustomLandmark);
router.get('/city/:city', getLandmarksByCity);

export default router;
