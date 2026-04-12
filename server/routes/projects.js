import express from 'express';
import { createProject, getProjects, getProject, updateProject, updateProjectItems, deleteProject } from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', createProject);
router.get('/', getProjects);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.put('/:id/items', updateProjectItems);
router.delete('/:id', deleteProject);

export default router;
