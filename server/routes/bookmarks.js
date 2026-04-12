import express from 'express';
import { addBookmark, getBookmarks, checkBookmark, removeBookmark } from '../controllers/bookmarkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', addBookmark);
router.get('/', getBookmarks);
router.get('/check/:resourceType/:resourceId', checkBookmark);
router.delete('/:id', removeBookmark);

export default router;
