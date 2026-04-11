import Zone from '../models/Zone.js';
import Road from '../models/Road.js';
import Landmark from '../models/Landmark.js';
import Utility from '../models/Utility.js';

// @desc    Find features near a point
// @route   GET /api/spatial/nearby?lng=73.05&lat=33.72&maxDistance=5000&type=landmark
export const nearby = async (req, res, next) => {
  try {
    const { lng, lat, maxDistance = 5000, type } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'Please provide lng and lat' });
    }

    const point = {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)],
    };

    const geoQuery = {
      geometry: {
        $near: {
          $geometry: point,
          $maxDistance: parseInt(maxDistance),
        },
      },
    };

    let results = {};

    if (!type || type === 'landmark') {
      results.landmarks = await Landmark.find(geoQuery).limit(20);
    }
    if (!type || type === 'zone') {
      results.zones = await Zone.find(geoQuery).limit(20);
    }
    if (!type || type === 'road') {
      results.roads = await Road.find(geoQuery).limit(20);
    }
    if (!type || type === 'utility') {
      results.utilities = await Utility.find(geoQuery).limit(20);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Find features within a polygon/box
// @route   POST /api/spatial/within
export const within = async (req, res, next) => {
  try {
    const { polygon, type } = req.body;

    if (!polygon) {
      return res.status(400).json({ success: false, message: 'Please provide a polygon' });
    }

    const geoQuery = {
      geometry: {
        $geoWithin: {
          $geometry: {
            type: 'Polygon',
            coordinates: polygon,
          },
        },
      },
    };

    let results = {};

    if (!type || type === 'landmark') {
      results.landmarks = await Landmark.find(geoQuery);
    }
    if (!type || type === 'zone') {
      results.zones = await Zone.find(geoQuery);
    }
    if (!type || type === 'road') {
      results.roads = await Road.find(geoQuery);
    }

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
};

// @desc    Buffer/radius analysis around a point
// @route   GET /api/spatial/buffer?lng=73.05&lat=33.72&radius=2000
export const buffer = async (req, res, next) => {
  try {
    const { lng, lat, radius = 2000 } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ success: false, message: 'Please provide lng and lat' });
    }

    const centerPoint = [parseFloat(lng), parseFloat(lat)];
    const radiusInRadians = parseInt(radius) / 6378137; // Earth radius in meters

    const geoQuery = {
      geometry: {
        $geoWithin: {
          $centerSphere: [centerPoint, radiusInRadians],
        },
      },
    };

    const [landmarks, zones, roads, utilities] = await Promise.all([
      Landmark.find(geoQuery),
      Zone.find(geoQuery),
      Road.find(geoQuery),
      Utility.find(geoQuery),
    ]);

    res.json({
      success: true,
      data: {
        landmarks,
        zones,
        roads,
        utilities,
        summary: {
          total_landmarks: landmarks.length,
          total_zones: zones.length,
          total_roads: roads.length,
          total_utilities: utilities.length,
          radius_meters: parseInt(radius),
          center: { lng: parseFloat(lng), lat: parseFloat(lat) },
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
