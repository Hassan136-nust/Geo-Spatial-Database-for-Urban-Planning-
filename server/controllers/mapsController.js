import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';
import cacheService from '../services/cacheService.js';


// @desc    Search/geocode an area by name
// @route   GET /api/maps/search-area?q=Islamabad
export const searchArea = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Please provide a query (q)' });
    }
    const results = await osmService.searchArea(q);
    res.json({ success: true, count: results.length, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Get nearby places via Overpass API
// @route   GET /api/maps/nearby-places?lat=33.7&lng=73.05&radius=5000&type=hospital
export const nearbyPlaces = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, type } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Please provide lat and lng' });
    }

    let places;
    if (type && type !== 'all') {
      places = await osmService.getNearbyPlaces(parseFloat(lat), parseFloat(lng), parseInt(radius), type);
    } else {
      places = await osmService.getNearbyAllTypes(parseFloat(lat), parseFloat(lng), parseInt(radius));
    }

    places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    res.json({ success: true, count: places.length, data: places });
  } catch (error) {
    next(error);
  }
};

// @desc    Get roads in an area
// @route   GET /api/maps/roads?lat=33.7&lng=73.05&radius=3000
export const roads = async (req, res, next) => {
  try {
    const { lat, lng, radius = 3000 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Please provide lat and lng' });
    }
    const roadData = await osmService.getRoads(parseFloat(lat), parseFloat(lng), parseInt(radius));
    res.json({ success: true, count: roadData?.length || 0, data: roadData || [] });
  } catch (error) {
    next(error);
  }
};

// @desc    Get directions between two points
// @route   GET /api/maps/directions?olat=33.7&olng=73.05&dlat=33.71&dlng=73.06
export const directions = async (req, res, next) => {
  try {
    const { olat, olng, dlat, dlng } = req.query;
    if (!olat || !olng || !dlat || !dlng) {
      return res.status(400).json({ success: false, message: 'Provide olat, olng, dlat, dlng' });
    }
    const route = await osmService.getDirections(
      parseFloat(olat), parseFloat(olng), parseFloat(dlat), parseFloat(dlng)
    );
    if (!route) {
      return res.status(404).json({ success: false, message: 'No route found' });
    }
    res.json({ success: true, data: route });
  } catch (error) {
    next(error);
  }
};

// @desc    Reverse geocode coordinates
// @route   GET /api/maps/reverse?lat=33.7&lng=73.05
export const reverse = async (req, res, next) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }
    const result = await osmService.reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Analyze an area — fetches fresh data, validates, retries on rate limit
// @route   POST /api/maps/analyze-area
export const analyzeSelectedArea = async (req, res, next) => {
  try {
    const startTime = Date.now();
    const { lat, lng, radius = 5000, areaName = 'Selected Area' } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radius) || 5000;

    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return res.status(400).json({ success: false, message: 'Invalid coordinates provided' });
    }

    console.log(`[Maps/Analyze] Analyzing: "${areaName}" at (${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)})`);

    // Fetch places AND roads IN PARALLEL (saves ~15s vs sequential)
    const [placesResult, roadsResult] = await Promise.allSettled([
      osmService.getNearbyAllTypes(parsedLat, parsedLng, parsedRadius, { skipThrottle: true }),
      osmService.getRoads(parsedLat, parsedLng, Math.min(parsedRadius, 3000), { skipThrottle: true }),
    ]);

    let places = placesResult.status === 'fulfilled' ? placesResult.value : [];
    let roadData = roadsResult.status === 'fulfilled' ? roadsResult.value : [];

    // Smart retry: only if places=0 AND roads succeeded (Overpass is reachable)
    if (places.length === 0 && roadData.length > 0) {
      console.warn(`[Maps/Analyze] ⚠️ 0 places but ${roadData.length} roads — retrying places in 2s...`);
      await new Promise(r => setTimeout(r, 2000));
      try {
        places = await osmService.getNearbyAllTypes(parsedLat, parsedLng, parsedRadius);
        console.log(`[Maps/Analyze] Retry result: ${places.length} places`);
      } catch (retryErr) {
        console.error('[Maps/Analyze] Retry places error:', retryErr.message);
      }
    }

    console.log(`[Maps/Analyze] Data: ${places.length} places, ${roadData.length} roads (${Date.now() - startTime}ms)`);

    // Save to cache (non-blocking)
    if (places.length > 0 || roadData.length > 0) {
      cacheService.saveLandmarksFromOSM(places, '', null).catch(err => 
        console.error('[Maps/Analyze] Cache save landmarks error:', err.message)
      );
      cacheService.saveRoadsFromOSM(roadData, '', null).catch(err => 
        console.error('[Maps/Analyze] Cache save roads error:', err.message)
      );
    }

    // Run analysis
    let analysis = null;
    try {
      analysis = analyzeArea(places, parsedLat, parsedLng, parsedRadius / 1000, roadData?.length || 0);
      console.log(`[Maps/Analyze] Score: ${analysis.score}/100 (${analysis.rating}) — total ${Date.now() - startTime}ms`);
    } catch (analysisErr) {
      console.error('[Maps/Analyze] Analysis engine error:', analysisErr.message);
      throw new Error('Internal analysis engine failed');
    }

    // Trim places to essential fields only (reduce payload size)
    const trimmedPlaces = places.map(p => ({
      id: p.id,
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
        areaName,
        analysis,
        places: trimmedPlaces,
        roadCount: roadData?.length || 0,
      },
    });
  } catch (error) {
    console.error('[Maps/Analyze] Final Error:', error.message);
    if (!res.headersSent) {
      res.status(error.status || 500).json({ 
        success: false, 
        message: error.message || 'Analysis failed due to server error' 
      });
    }
  }
};
