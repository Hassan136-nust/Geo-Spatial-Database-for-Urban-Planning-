import express from 'express';
import { saveDesign, getUserDesigns, getDesign, updateDesign, deleteDesign, aiGenerateCity } from '../controllers/plannerController.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// AI generate — optionalAuth so logged-out users get a friendly message too
router.post('/ai-generate', optionalAuth, aiGenerateCity);

router.use(protect); // All other planner routes require auth

router.post('/save', saveDesign);
router.get('/user-designs', getUserDesigns);
router.get('/:id', getDesign);
router.put('/:id', updateDesign);
router.delete('/:id', deleteDesign);

export default router;
