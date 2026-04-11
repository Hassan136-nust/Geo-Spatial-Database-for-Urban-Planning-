import osmService from '../services/osmService.js';
import { analyzeArea } from '../services/analysisService.js';

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

// @desc    Get nearby places from OpenStreetMap
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

    // Sort by distance
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
    res.json({ success: true, count: roadData.length, data: roadData });
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

// @desc    Analyze an area - fetch places + roads + run analysis
// @route   POST /api/maps/analyze-area
export const analyzeSelectedArea = async (req, res, next) => {
  try {
    const { lat, lng, radius = 5000, areaName = 'Selected Area' } = req.body;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide lat and lng' });
    }

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadius = parseInt(radius);

    // Fetch places and roads sequentially to prevent Overpass API 429 Rate Limit errors
    const places = await osmService.getNearbyAllTypes(parsedLat, parsedLng, parsedRadius);
    const roadData = await osmService.getRoads(parsedLat, parsedLng, Math.min(parsedRadius, 3000));

    // Run analysis with road data included
    const analysis = analyzeArea(
      places,
      parsedLat,
      parsedLng,
      parsedRadius / 1000,
      roadData.length // pass road count for road scoring
    );

    res.json({
      success: true,
      data: {
        areaName,
        analysis,
        places: places, // Return all places
        roadCount: roadData.length,
      },
    });
  } catch (error) {
    next(error);
  }
};
