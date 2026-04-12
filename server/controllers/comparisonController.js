import AreaComparison from '../models/AreaComparison.js';
import AnalyticsResult from '../models/AnalyticsResult.js';
import SavedArea from '../models/SavedArea.js';
import { logActivity } from '../services/activityService.js';

// @desc    Create area comparison
// @route   POST /api/comparisons
export const createComparison = async (req, res, next) => {
  try {
    const { name, area_ids, notes } = req.body;
    if (!area_ids || area_ids.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 area IDs required' });
    }

    // Fetch areas and their analytics
    const areasData = await Promise.all(
      area_ids.map(async (id) => {
        const area = await SavedArea.findById(id).lean();
        const analytics = await AnalyticsResult.findOne({ area_id: id }).sort({ timestamp: -1 }).lean();
        return { area, analytics };
      })
    );

    const validAreas = areasData.filter((a) => a.area && a.analytics);
    if (validAreas.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 areas with analytics required' });
    }

    // Build comparison
    const areas = validAreas.map((a) => ({
      area_id: a.area._id,
      area_name: a.area.area_name,
      score: a.analytics.score,
      coverage_summary: a.analytics.coverage_data,
    }));

    // Determine winner
    const winner = areas.reduce((best, current) => current.score > best.score ? current : best, areas[0]);

    // Build comparison metrics
    const metrics = {};
    const metricTypes = ['hospital', 'school', 'park', 'police', 'pharmacy'];
    metricTypes.forEach((type) => {
      metrics[type] = {};
      validAreas.forEach((a) => {
        const cov = a.analytics.coverage_data?.[type];
        metrics[type][a.area.area_name] = {
          count: cov?.count || 0,
          score: cov?.score || 0,
          nearest: cov?.nearest || null,
          status: cov?.status || 'missing',
        };
      });
    });

    const comparison = await AreaComparison.create({
      user_id: req.user.id,
      name: name || areas.map((a) => a.area_name).join(' vs '),
      areas,
      winner_area_id: winner.area_id,
      comparison_metrics: { healthcare: metrics.hospital, education: metrics.school, green_space: metrics.park, safety: metrics.police, overall: { scores: areas.map((a) => ({ name: a.area_name, score: a.score })), winner: winner.area_name } },
      notes: notes || '',
    });

    logActivity(req.user.id, 'compare_areas', 'comparison', comparison._id, { areas: area_ids }, req);
    res.status(201).json({ success: true, data: comparison });
  } catch (error) { next(error); }
};

// @desc    Get user comparisons
// @route   GET /api/comparisons
export const getComparisons = async (req, res, next) => {
  try {
    const comparisons = await AreaComparison.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    res.json({ success: true, count: comparisons.length, data: comparisons });
  } catch (error) { next(error); }
};

// @desc    Get single comparison
// @route   GET /api/comparisons/:id
export const getComparison = async (req, res, next) => {
  try {
    const comparison = await AreaComparison.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!comparison) return res.status(404).json({ success: false, message: 'Comparison not found' });
    res.json({ success: true, data: comparison });
  } catch (error) { next(error); }
};

// @desc    Delete comparison
// @route   DELETE /api/comparisons/:id
export const deleteComparison = async (req, res, next) => {
  try {
    const comparison = await AreaComparison.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!comparison) return res.status(404).json({ success: false, message: 'Comparison not found' });
    res.json({ success: true, message: 'Comparison deleted' });
  } catch (error) { next(error); }
};
