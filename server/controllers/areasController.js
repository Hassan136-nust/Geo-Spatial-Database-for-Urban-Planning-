import SavedArea from '../models/SavedArea.js';
import AnalyticsResult from '../models/AnalyticsResult.js';
import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';
import cacheService from '../services/cacheService.js';
import { logActivity } from '../services/activityService.js';
import { notify } from '../services/notificationService.js';

// @desc    Search area → geocode → fetch → save → analyze → return
// @route   POST /api/areas/search
export const searchArea = async (req, res, next) => {
  try {
    const startTime = Date.now();
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
    const radiusKm = parsedRadius / 1000;

    // 2. Upsert CityProfile (non-blocking — don't wait)
    let cityProfile = null;
    let cityName = '';
    const cityPromise = cacheService.upsertCityProfile(area)
      .then(cp => { cityProfile = cp; cityName = cp?.name || ''; })
      .catch(cpErr => console.error('[Areas] CityProfile error (non-fatal):', cpErr.message));

    // 3. CHECK DB CACHE FIRST — skip Overpass if we have fresh data
    let places = [];
    let roadData = [];
    let roadCount = 0;
    let usedCache = false;

    try {
      console.log(`[Areas] Checking DB cache for (${lat.toFixed(4)}, ${lng.toFixed(4)})...`);
      const [cachedLandmarks, cachedRoads] = await Promise.all([
        cacheService.findCachedLandmarks(lat, lng, radiusKm),
        cacheService.findCachedRoads(lat, lng, Math.min(radiusKm, 3)),
      ]);

      if (cachedLandmarks.length >= 5 && cachedRoads.length >= 3) {
        // Use DB cache — near-instant response
        console.log(`[Areas] ✅ DB cache HIT: ${cachedLandmarks.length} landmarks, ${cachedRoads.length} roads`);
        places = cachedLandmarks.map(l => ({
          id: l.osm_id || l._id,
          name: l.name,
          type: l.type,
          lat: l.geometry?.coordinates?.[1],
          lng: l.geometry?.coordinates?.[0],
          distance: haversineDistance(lat, lng, l.geometry?.coordinates?.[1], l.geometry?.coordinates?.[0]),
          address: l.address || '',
        }));
        roadCount = cachedRoads.length;
        usedCache = true;
      }
    } catch (cacheErr) {
      console.warn('[Areas] DB cache check failed (non-fatal):', cacheErr.message);
    }

    if (!usedCache) {
      // 4. Fetch places AND roads from Overpass IN PARALLEL (biggest perf win)
      console.log(`[Areas] DB cache miss — fetching from Overpass in parallel...`);
      const [placesResult, roadsResult] = await Promise.allSettled([
        osmService.getNearbyAllTypes(lat, lng, parsedRadius, { skipThrottle: true }),
        osmService.getRoads(lat, lng, Math.min(parsedRadius, 3000), { skipThrottle: true }),
      ]);

      places = placesResult.status === 'fulfilled' ? placesResult.value : [];
      roadData = roadsResult.status === 'fulfilled' ? roadsResult.value : [];
      roadCount = roadData.length;

      // 5. Smart retry: only if places=0 AND roads succeeded (Overpass is reachable)
      if (places.length === 0 && roadCount > 0) {
        console.warn(`[Areas] ⚠️ 0 places but ${roadCount} roads — retrying places in 2s...`);
        await new Promise(r => setTimeout(r, 2000));
        places = await osmService.getNearbyAllTypes(lat, lng, parsedRadius);
        console.log(`[Areas] Retry result: ${places.length} places`);
      }

      console.log(`[Areas] Overpass data: ${places.length} landmarks, ${roadCount} roads (${Date.now() - startTime}ms)`);

      // 6. Save fetched data to DB cache (non-blocking)
      if (places.length > 0 || roadData.length > 0) {
        await cityPromise; // Ensure cityName is resolved
        cacheService.saveLandmarksFromOSM(places, cityName, null).catch(err => 
          console.error('[Areas] DB cache landmarks save error:', err.message)
        );
        cacheService.saveRoadsFromOSM(roadData, cityName, null).catch(err => 
          console.error('[Areas] DB cache roads save error:', err.message)
        );
      }
    }

    // Wait for city profile if not yet resolved
    await cityPromise;

    // 7. Run analysis
    const analysis = analyzeArea(places, lat, lng, radiusKm, roadCount);
    console.log(`[Areas] Analysis score: ${analysis.score}/100 (${analysis.rating}) — ${places.length} places, ${roadCount} roads — total ${Date.now() - startTime}ms`);

    // 8. Save area & analytics (only if user is authenticated)
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
          radius_km: radiusKm,
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

        // Update city profile counts (non-blocking)
        if (cityProfile) {
          Promise.all([
            import('../models/Landmark.js').then(m => m.default.countDocuments({ city: cityName })),
            import('../models/Road.js').then(m => m.default.countDocuments({ city: cityName })),
          ]).then(([lc, rc]) => {
            cityProfile.landmark_count = lc;
            cityProfile.road_count = rc;
            cityProfile.save().catch(() => {});
          }).catch(() => {});
        }
      } catch (dbErr) {
        console.error('[Areas] ❌ DB persistence error:', dbErr.message);
      }
    } else {
      console.log('[Areas] Anonymous user — skipping DB persistence');
    }

    // Trim places to essential fields only (reduces 900KB → ~50KB response)
    const trimmedPlaces = places.map(p => ({
      id: p.id || p.osm_id,
      name: p.name,
      type: p.type,
      lat: p.lat,
      lng: p.lng,
      distance: p.distance,
      address: p.address || '',
    }));

    res.json({
      success: true,
      data: {
        area: savedArea || { lat, lng, displayName: area.displayName },
        analysis,
        places: trimmedPlaces,
        roadCount,
        city: cityName,
        analyticsId: analyticsDoc?._id || null,
      },
    });
  } catch (error) {
    console.error('[Areas] Search error:', error.message);
    // Ensure we always send valid JSON, even on error
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message || 'Area search failed',
      });
    }
  }
};

// Haversine distance helper for DB-cached results
function haversineDistance(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 0;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
}

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
