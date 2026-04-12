import express from 'express';
import { saveDesign, getUserDesigns, getDesign, updateDesign, deleteDesign } from '../controllers/plannerController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect); // All planner routes require auth

router.post('/save', saveDesign);
router.get('/user-designs', getUserDesigns);
router.get('/:id', getDesign);
router.put('/:id', updateDesign);
router.delete('/:id', deleteDesign);

export default router;
