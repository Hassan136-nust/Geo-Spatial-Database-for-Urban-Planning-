import express from 'express';
import { searchArea, getAreaHistory, getArea, deleteArea } from '../controllers/areasController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/search', optionalAuth, searchArea);      // Public — but saves if logged in
router.get('/history', protect, getAreaHistory);
router.get('/:id', protect, getArea);
router.delete('/:id', protect, deleteArea);

export default router;
