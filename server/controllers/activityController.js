import ActivityLog from '../models/ActivityLog.js';

// @desc    Get user activity feed
// @route   GET /api/activity
export const getActivityFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      ActivityLog.find({ user_id: req.user.id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      ActivityLog.countDocuments({ user_id: req.user.id }),
    ]);

    res.json({ success: true, count: activities.length, total, data: activities });
  } catch (error) { next(error); }
};

// @desc    Get activity statistics
// @route   GET /api/activity/stats
export const getActivityStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [totalActions, weeklyActions, actionBreakdown, recentActions] = await Promise.all([
      ActivityLog.countDocuments({ user_id: userId }),
      ActivityLog.countDocuments({ user_id: userId, timestamp: { $gte: weekAgo } }),
      ActivityLog.aggregate([
        { $match: { user_id: userId.__proto__.constructor === String ? userId : require('mongoose').Types.ObjectId(userId), timestamp: { $gte: monthAgo } } },
        { $group: { _id: '$action', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).catch(() => []),
      ActivityLog.find({ user_id: userId }).sort({ timestamp: -1 }).limit(5).lean(),
    ]);

    res.json({
      success: true,
      data: {
        totalActions,
        weeklyActions,
        actionBreakdown,
        recentActions,
      },
    });
  } catch (error) { next(error); }
};
