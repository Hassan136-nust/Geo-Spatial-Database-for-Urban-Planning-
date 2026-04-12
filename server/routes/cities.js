import express from 'express';
import { getCities, getCityProfile, getCityStats } from '../controllers/cityController.js';

const router = express.Router();

router.get('/', getCities);
router.get('/:name', getCityProfile);
router.get('/:name/stats', getCityStats);

export default router;
