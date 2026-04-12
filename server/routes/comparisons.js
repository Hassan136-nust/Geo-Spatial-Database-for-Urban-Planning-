import express from 'express';
import { createComparison, getComparisons, getComparison, deleteComparison } from '../controllers/comparisonController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createComparison);
router.get('/', getComparisons);
router.get('/:id', getComparison);
router.delete('/:id', deleteComparison);

export default router;
