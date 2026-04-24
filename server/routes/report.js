import express from 'express';
import { evaluateUserLayout, generatePDFReport, getUserReports, downloadReport, deleteReport } from '../controllers/reportController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/evaluate-layout', evaluateUserLayout);
router.post('/generate', optionalAuth, generatePDFReport); // optionalAuth: saves to DB if logged in
router.get('/history', protect, getUserReports);
router.get('/:id/download', protect, downloadReport);
router.delete('/:id', protect, deleteReport);

export default router;


