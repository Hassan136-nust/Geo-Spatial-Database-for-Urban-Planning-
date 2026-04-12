import CityProfile from '../models/CityProfile.js';
import Landmark from '../models/Landmark.js';

// @desc    List cached city profiles
// @route   GET /api/cities
export const getCities = async (req, res, next) => {
  try {
    const { search } = req.query;
    const filter = {};
    if (search) filter.name = { $regex: new RegExp(search, 'i') };

    const cities = await CityProfile.find(filter)
      .sort({ search_count: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, count: cities.length, data: cities });
  } catch (error) { next(error); }
};

// @desc    Get city profile
// @route   GET /api/cities/:name
export const getCityProfile = async (req, res, next) => {
  try {
    const city = await CityProfile.findOne({
      name: { $regex: new RegExp(`^${req.params.name}$`, 'i') },
    });

    if (!city) {
      return res.status(404).json({ success: false, message: 'City not found in database. Search for it first.' });
    }

    res.json({ success: true, data: city });
  } catch (error) { next(error); }
};

// @desc    Get city aggregated stats
// @route   GET /api/cities/:name/stats
export const getCityStats = async (req, res, next) => {
  try {
    const cityName = req.params.name;

    const [landmarksByType, totalLandmarks] = await Promise.all([
      Landmark.aggregate([
        { $match: { city: { $regex: new RegExp(cityName, 'i') } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Landmark.countDocuments({ city: { $regex: new RegExp(cityName, 'i') } }),
    ]);

    res.json({
      success: true,
      data: {
        city: cityName,
        totalLandmarks,
        landmarksByType,
      },
    });
  } catch (error) { next(error); }
};
