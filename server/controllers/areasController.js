import SavedArea from '../models/SavedArea.js';
import AnalyticsResult from '../models/AnalyticsResult.js';
import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';
import cacheService from '../services/cacheService.js';
import { logActivity } from '../services/activityService.js';
import { notify } from '../services/notificationService.js';

// Helper: delay between API calls
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

// @desc    Search area → geocode → fetch → save → analyze → return
// @route   POST /api/areas/search
export const searchArea = async (req, res, next) => {
  try {
    const { query, radius = 5000 } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Please provide a search query' });
    }

    console.log(`[Areas] Searching: "${query}" (radius: ${radius}m, user: ${req.user?.id || 'anonymous'})`);

    // 1. Geocode the query
    const searchResults = await osmService.searchArea(query);
    if (!searchResults || searchResults.length === 0) {
      return res.status(404).json({ success: false, message: 'No results found for this search' });
    }

    const area = searchResults[0];
    const { lat, lng } = area;
    const parsedRadius = parseInt(radius);

    // 2. Upsert CityProfile
    let cityProfile = null;
    let cityName = '';
    try {
      cityProfile = await cacheService.upsertCityProfile(area);
      cityName = cityProfile?.name || '';
    } catch (cpErr) {
      console.error('[Areas] CityProfile error (non-fatal):', cpErr.message);
    }

    // 3. Fetch places from OSM (with built-in retry)
    console.log(`[Areas] Fetching places from OSM for (${lat.toFixed(4)}, ${lng.toFixed(4)})...`);
    let places = await osmService.getNearbyAllTypes(lat, lng, parsedRadius);

    // 4. Wait before roads call to prevent Overpass 429
    await delay(2500);

    // 5. Fetch roads
    const roadData = await osmService.getRoads(lat, lng, Math.min(parsedRadius, 3000));
    const roadCount = roadData.length;

    // 6. VALIDATION: If places=0 but roads>0, the places query likely got rate-limited
    //    Retry once more after a delay
    if (places.length === 0 && roadCount > 0) {
      console.warn(`[Areas] ⚠️ Got 0 places but ${roadCount} roads — likely rate-limited. Retrying places in 4s...`);
      await delay(4000);
      places = await osmService.getNearbyAllTypes(lat, lng, parsedRadius);
      console.log(`[Areas] Retry result: ${places.length} places`);
    }

    console.log(`[Areas] Final data: ${places.length} landmarks, ${roadCount} roads`);

    // 7. Save fetched data to DB cache
    try {
      const savedLandmarks = await cacheService.saveLandmarksFromOSM(places, cityName, null);
      const savedRoads = await cacheService.saveRoadsFromOSM(roadData, cityName, null);
      console.log(`[Areas] Saved to DB cache: ${savedLandmarks} landmarks, ${savedRoads} roads`);
    } catch (saveErr) {
      console.error('[Areas] DB cache save error (non-fatal):', saveErr.message);
    }

    // 8. Run analysis
    const analysis = analyzeArea(places, lat, lng, parsedRadius / 1000, roadCount);
    console.log(`[Areas] Analysis score: ${analysis.score}/100 (${analysis.rating}) — ${places.length} places, ${roadCount} roads`);

    // 9. Save area & analytics (only if user is authenticated)
    const userId = req.user?.id || null;
    let savedArea = null;
    let analyticsDoc = null;

    if (userId) {
      try {
        savedArea = await SavedArea.create({
          user_id: userId,
          area_name: query,
          display_name: area.displayName,
          coordinates: { type: 'Point', coordinates: [lng, lat] },
          bounding_box: area.boundingBox || [],
          radius: parsedRadius,
          geojson: area.geojson || null,
          city: cityName,
          country: area.address?.country || '',
          source: 'search',
          last_analysis_score: analysis.score,
          landmark_count: places.length,
          road_count: roadCount,
        });
        console.log(`[Areas] ✅ SavedArea created: ${savedArea._id}`);

        analyticsDoc = await AnalyticsResult.create({
          user_id: userId,
          area_id: savedArea._id,
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
          center: { lat, lng },
        });
        console.log(`[Areas] ✅ AnalyticsResult created: ${analyticsDoc._id}`);

        logActivity(userId, 'search_area', 'area', savedArea._id, { query, lat, lng, score: analysis.score }, req);
        notify(userId, 'Analysis Complete ✅', `${query} scored ${analysis.score}/100`, {
          type: 'success',
          category: 'analysis_complete',
          link: '/saved-areas',
          resourceId: savedArea._id,
        });

        // Update city profile counts
        if (cityProfile) {
          try {
            cityProfile.landmark_count = await import('../models/Landmark.js').then((m) => m.default.countDocuments({ city: cityName }));
            cityProfile.road_count = await import('../models/Road.js').then((m) => m.default.countDocuments({ city: cityName }));
            await cityProfile.save();
          } catch (cpErr) { /* non-fatal */ }
        }
      } catch (dbErr) {
        console.error('[Areas] ❌ DB persistence error:', dbErr.message);
      }
    } else {
      console.log('[Areas] Anonymous user — skipping DB persistence');
    }

    res.json({
      success: true,
      data: {
        area: savedArea || { lat, lng, displayName: area.displayName },
        analysis,
        places,
        roadCount,
        city: cityName,
        analyticsId: analyticsDoc?._id || null,
      },
    });
  } catch (error) {
    console.error('[Areas] Search error:', error.message);
    next(error);
  }
};

// @desc    Get user's saved area history
// @route   GET /api/areas/history
export const getAreaHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [areas, total] = await Promise.all([
      SavedArea.find({ user_id: req.user.id })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      SavedArea.countDocuments({ user_id: req.user.id }),
    ]);

    res.json({
      success: true,
      count: areas.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      data: areas,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single saved area with analytics
// @route   GET /api/areas/:id
export const getArea = async (req, res, next) => {
  try {
    const area = await SavedArea.findById(req.params.id);
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }

    const analytics = await AnalyticsResult.findOne({ area_id: area._id }).sort({ timestamp: -1 });

    res.json({ success: true, data: { area, analytics } });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved area
// @route   DELETE /api/areas/:id
export const deleteArea = async (req, res, next) => {
  try {
    const area = await SavedArea.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!area) {
      return res.status(404).json({ success: false, message: 'Area not found' });
    }

    await AnalyticsResult.deleteMany({ area_id: area._id });
    logActivity(req.user.id, 'delete_area', 'area', area._id, { deleted: true }, req);

    res.json({ success: true, message: 'Area deleted' });
  } catch (error) {
    next(error);
  }
};
