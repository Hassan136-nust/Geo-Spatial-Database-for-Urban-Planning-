import AnalyticsResult from '../models/AnalyticsResult.js';
import SavedArea from '../models/SavedArea.js';
import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';

// @desc    Run analysis for an area, save result
// @route   POST /api/analytics/run
export const runAnalytics = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, areaId } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radius);

    const [places, roadData] = await Promise.all([
      osmService.getNearbyAllTypes(parsedLat, parsedLng, parsedRadius),
      osmService.getRoads(parsedLat, parsedLng, Math.min(parsedRadius, 3000))
    ]);
    const analysis = analyzeArea(places, parsedLat, parsedLng, parsedRadius / 1000, roadData.length);

    if (req.user && areaId) {
      await AnalyticsResult.create({
        user_id: req.user.id,
        area_id: areaId,
        score: analysis.score,
        rating: analysis.rating,
        coverage_data: analysis.coverage,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
        scoring: analysis.scoring,
        density: analysis.density,
        total_places: analysis.totalPlaces,
        gaps: analysis.gaps,
        radius_km: parsedRadius / 1000,
        center: { lat: parsedLat, lng: parsedLng },
      });
    }

    res.json({ success: true, data: { analysis, places, roadCount: roadData.length } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get cached analytics for an area
// @route   GET /api/analytics/area/:areaId
export const getAreaAnalytics = async (req, res, next) => {
  try {
    const analytics = await AnalyticsResult.findOne({ area_id: req.params.areaId })
      .sort({ timestamp: -1 })
      .lean();

    if (!analytics) {
      return res.status(404).json({ success: false, message: 'No analytics found for this area' });
    }

    res.json({ success: true, data: analytics });
  } catch (error) {
    next(error);
  }
};
