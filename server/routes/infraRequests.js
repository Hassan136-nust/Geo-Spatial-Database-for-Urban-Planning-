import express from 'express';
import { submitRequest, getRequests, getMyRequests, voteRequest, reviewRequest, deleteRequest } from '../controllers/infraRequestController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getRequests);                                       // Public browsing
router.get('/mine', protect, getMyRequests);
router.post('/', protect, submitRequest);
router.put('/:id/vote', protect, voteRequest);
router.put('/:id/review', protect, authorize('admin'), reviewRequest);
router.delete('/:id', protect, deleteRequest);

export default router;
