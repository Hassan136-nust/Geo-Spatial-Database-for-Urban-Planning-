import express from 'express';
import { overview, coverage, gaps, zoneSummary } from '../controllers/analyticsController.js';

const router = express.Router();

router.get('/overview', overview);
router.get('/coverage', coverage);
router.get('/gaps', gaps);
router.get('/zone-summary', zoneSummary);

export default router;
