import AreaComparison from '../models/AreaComparison.js';
import AnalyticsResult from '../models/AnalyticsResult.js';
import SavedArea from '../models/SavedArea.js';
import { logActivity } from '../services/activityService.js';

// Helper to calculate distance between two coordinates in km using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; // Distance in km
};

// @desc    Create area comparison
// @route   POST /api/comparisons
export const createComparison = async (req, res, next) => {
  try {
    const { name, area_ids, notes } = req.body;
    if (!area_ids || area_ids.length < 2) {
      return res.status(400).json({ success: false, message: 'At least 2 area IDs required' });
    }

    // Duplicate validation
    const uniqueAreaIds = new Set(area_ids);
    if (uniqueAreaIds.size !== area_ids.length) {
      return res.status(400).json({ success: false, message: 'Cannot compare an area with itself. Please select different areas.' });
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

    // Coordinate proximity check (if they are within 0.5km, they are effectively the same area)
    if (validAreas.length === 2 && validAreas[0].area.center && validAreas[1].area.center) {
      const dist = calculateDistance(
        validAreas[0].area.center.lat, validAreas[0].area.center.lng,
        validAreas[1].area.center.lat, validAreas[1].area.center.lng
      );
      if (dist < 0.5) {
        return res.status(400).json({ success: false, message: 'Areas are too close to each other (<0.5km). Select distinct areas to compare.' });
      }
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
    const loser = areas.find(a => a.area_id !== winner.area_id) || areas[1];

    // Build comparison metrics and difference analysis
    const metrics = {};
    const difference_analysis = {};
    const metricTypes = ['hospital', 'school', 'park', 'police', 'pharmacy', 'road'];
    
    // Mapping internal types to display names
    const typeNames = {
      hospital: 'healthcare',
      school: 'education',
      park: 'green_space',
      police: 'safety',
      pharmacy: 'healthcare', // We can group or just keep separate
      road: 'connectivity'
    };

    metricTypes.forEach((type) => {
      metrics[type] = {};
      const scores = [];
      validAreas.forEach((a) => {
        const cov = a.analytics.coverage_data?.[type];
        const score = cov?.score || 0;
        metrics[type][a.area.area_name] = {
          count: cov?.count || 0,
          score: score,
          nearest: cov?.nearest || null,
          status: cov?.status || 'missing',
        };
        scores.push({ name: a.area.area_name, score });
      });

      if (scores.length === 2) {
        const delta = scores[0].score - scores[1].score;
        const leader = delta > 0 ? scores[0].name : (delta < 0 ? scores[1].name : 'Tie');
        difference_analysis[type] = {
          delta: Math.abs(delta),
          leader,
          lagging: leader === scores[0].name ? scores[1].name : (leader === scores[1].name ? scores[0].name : 'Tie')
        };
      }
    });

    // Build structured explanation
    let winner_explanation = `${winner.area_name} outperforms ${loser.area_name} with an overall score of ${winner.score} vs ${loser.score}. `;
    const leadingCategories = Object.keys(difference_analysis)
      .filter(type => difference_analysis[type].leader === winner.area_name);
    
    if (leadingCategories.length > 0) {
      winner_explanation += `It leads primarily in ${leadingCategories.map(c => typeNames[c] || c).join(', ')}.`;
    } else if (winner.score === loser.score) {
      winner_explanation = `Both areas tied with an overall score of ${winner.score}.`;
    }

    const comparison = await AreaComparison.create({
      user_id: req.user.id,
      name: name || areas.map((a) => a.area_name).join(' vs '),
      areas,
      winner_area_id: winner.area_id,
      comparison_metrics: { 
        healthcare: metrics.hospital, 
        education: metrics.school, 
        green_space: metrics.park, 
        safety: metrics.police, 
        connectivity: metrics.road,
        overall: { 
          scores: areas.map((a) => ({ name: a.area_name, score: a.score })), 
          winner: winner.area_name 
        } 
      },
      notes: notes || '',
      winner_explanation,
      difference_analysis
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
