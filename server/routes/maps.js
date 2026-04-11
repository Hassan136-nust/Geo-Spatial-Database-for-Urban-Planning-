import express from 'express';
import { searchArea, nearbyPlaces, roads, directions, reverse, analyzeSelectedArea } from '../controllers/mapsController.js';

const router = express.Router();

router.get('/search-area', searchArea);
router.get('/nearby-places', nearbyPlaces);
router.get('/roads', roads);
router.get('/directions', directions);
router.get('/reverse', reverse);
router.post('/analyze-area', analyzeSelectedArea);

export default router;
