import express from 'express';
import { nearby, within, buffer } from '../controllers/spatialController.js';

const router = express.Router();

router.get('/nearby', nearby);
router.post('/within', within);
router.get('/buffer', buffer);

export default router;
