import express from 'express';
import { evaluateUserLayout, generatePDFReport } from '../controllers/reportController.js';

const router = express.Router();

router.post('/evaluate-layout', evaluateUserLayout);
router.post('/generate', generatePDFReport);

export default router;
