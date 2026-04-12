import Bookmark from '../models/Bookmark.js';
import { logActivity } from '../services/activityService.js';

// @desc    Add bookmark
// @route   POST /api/bookmarks
export const addBookmark = async (req, res, next) => {
  try {
    const { resource_type, resource_id, resource_name, lat, lng, notes, tags } = req.body;
    if (!resource_type || !resource_id) {
      return res.status(400).json({ success: false, message: 'Provide resource_type and resource_id' });
    }

    const bookmark = await Bookmark.create({
      user_id: req.user.id, resource_type, resource_id, resource_name,
      location: lat && lng ? { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] } : undefined,
      notes, tags,
    });

    logActivity(req.user.id, 'add_bookmark', 'bookmark', bookmark._id, { resource_type, resource_name }, req);
    res.status(201).json({ success: true, data: bookmark });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Already bookmarked' });
    }
    next(error);
  }
};

// @desc    Get bookmarks
// @route   GET /api/bookmarks
export const getBookmarks = async (req, res, next) => {
  try {
    const { resource_type } = req.query;
    const filter = { user_id: req.user.id };
    if (resource_type) filter.resource_type = resource_type;

    const bookmarks = await Bookmark.find(filter).sort({ created_at: -1 }).lean();
    res.json({ success: true, count: bookmarks.length, data: bookmarks });
  } catch (error) { next(error); }
};

// @desc    Check if bookmarked
// @route   GET /api/bookmarks/check/:resourceType/:resourceId
export const checkBookmark = async (req, res, next) => {
  try {
    const exists = await Bookmark.findOne({
      user_id: req.user.id, resource_type: req.params.resourceType, resource_id: req.params.resourceId,
    });
    res.json({ success: true, bookmarked: !!exists, data: exists });
  } catch (error) { next(error); }
};

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/:id
export const removeBookmark = async (req, res, next) => {
  try {
    const bookmark = await Bookmark.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!bookmark) return res.status(404).json({ success: false, message: 'Bookmark not found' });
    logActivity(req.user.id, 'remove_bookmark', 'bookmark', bookmark._id, {}, req);
    res.json({ success: true, message: 'Bookmark removed' });
  } catch (error) { next(error); }
};
