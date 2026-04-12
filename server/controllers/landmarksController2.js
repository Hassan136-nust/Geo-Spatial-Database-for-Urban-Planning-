import Landmark from '../models/Landmark.js';
import osmService from '../services/osmService.js';
import cacheService from '../services/cacheService.js';
import { logActivity } from '../services/activityService.js';

// @desc    Fetch landmarks from OSM for a city, save to DB
// @route   POST /api/landmarks2/fetch
export const fetchLandmarks = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, city = '', forceRefresh = false } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radius);

    console.log(`[Landmarks2] Fetching for city="${city}" at (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}) radius=${parsedRadius}m`);

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = await cacheService.findCachedLandmarks(parsedLat, parsedLng, parsedRadius / 1000);
      if (cached.length >= 10) {
        console.log(`[Landmarks2] Cache HIT: ${cached.length} landmarks`);
        return res.json({
          success: true,
          cached: true,
          count: cached.length,
          data: cached,
        });
      }
    }

    // Fetch from OSM — includes university, hospital, school, park, etc.
    console.log(`[Landmarks2] Cache MISS or force refresh — fetching from OSM...`);
    const places = await osmService.getNearbyAllTypes(parsedLat, parsedLng, parsedRadius);
    console.log(`[Landmarks2] OSM returned ${places.length} places`);

    if (places.length === 0) {
      // Also try city-level DB search
      const cityLandmarks = city ? await Landmark.find({ city: { $regex: new RegExp(city, 'i') } }).limit(200).lean() : [];
      if (cityLandmarks.length > 0) {
        console.log(`[Landmarks2] Found ${cityLandmarks.length} landmarks by city name`);
        return res.json({
          success: true,
          cached: true,
          count: cityLandmarks.length,
          data: cityLandmarks,
        });
      }
      return res.json({ success: true, cached: false, fetched: 0, saved: 0, count: 0, data: [] });
    }

    // Save to DB
    const savedCount = await cacheService.saveLandmarksFromOSM(places, city);
    console.log(`[Landmarks2] Saved ${savedCount} landmarks to DB`);

    // Reload from DB for consistent format
    const landmarks = await cacheService.findCachedLandmarks(parsedLat, parsedLng, parsedRadius / 1000);
    console.log(`[Landmarks2] Returning ${landmarks.length} landmarks from DB`);

    if (req.user) {
      logActivity(req.user.id, 'fetch_landmarks', 'landmark', null, { city, count: landmarks.length }, req);
    }

    res.json({
      success: true,
      cached: false,
      fetched: places.length,
      saved: savedCount,
      count: landmarks.length,
      data: landmarks,
    });
  } catch (error) {
    console.error('[Landmarks2] Error:', error.message);
    next(error);
  }
};

// @desc    Save selected landmarks to database (bulk save button)
// @route   POST /api/landmarks2/save-bulk
export const saveLandmarksBulk = async (req, res, next) => {
  try {
    const { landmarks, city = '' } = req.body;
    if (!landmarks || !Array.isArray(landmarks) || landmarks.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide landmarks array' });
    }

    console.log(`[Landmarks2] Bulk saving ${landmarks.length} landmarks...`);

    // Convert to the format expected by saveLandmarksFromOSM
    const osmFormat = landmarks.map((l) => ({
      id: l.osm_id || l._id || l.id || Date.now() + Math.random(),
      name: l.name,
      type: l.type || l.subtype || 'other',
      lat: l.geometry?.coordinates?.[1] || l.lat,
      lng: l.geometry?.coordinates?.[0] || l.lng,
      address: l.address || '',
    }));

    const savedCount = await cacheService.saveLandmarksFromOSM(osmFormat, city);
    console.log(`[Landmarks2] Bulk saved ${savedCount} landmarks`);

    if (req.user) {
      logActivity(req.user.id, 'bulk_save_landmarks', 'landmark', null, { city, count: savedCount }, req);
    }

    res.json({ success: true, saved: savedCount, message: `${savedCount} landmarks saved to database` });
  } catch (error) {
    console.error('[Landmarks2] Bulk save error:', error.message);
    next(error);
  }
};

// @desc    Add a custom user landmark
// @route   POST /api/landmarks2/add
export const addCustomLandmark = async (req, res, next) => {
  try {
    const { name, type, lat, lng, city = '', description = '' } = req.body;

    if (!name || !type || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide name, type, lat, and lng' });
    }

    const landmark = await Landmark.create({
      name,
      type,
      geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      city,
      source: 'user',
      description,
      status: 'operational',
    });

    if (req.user) {
      logActivity(req.user.id, 'add_landmark', 'landmark', landmark._id, { name, type }, req);
    }

    res.status(201).json({ success: true, data: landmark });
  } catch (error) {
    next(error);
  }
};

// @desc    Get landmarks by city
// @route   GET /api/landmarks2/city/:city
export const getLandmarksByCity = async (req, res, next) => {
  try {
    const { city } = req.params;
    const { type, limit = 200 } = req.query;

    const filter = { city: { $regex: new RegExp(city, 'i') } };
    if (type) filter.type = type;

    const landmarks = await Landmark.find(filter)
      .sort({ name: 1 })
      .limit(parseInt(limit))
      .lean();

    res.json({ success: true, count: landmarks.length, data: landmarks });
  } catch (error) {
    next(error);
  }
};
