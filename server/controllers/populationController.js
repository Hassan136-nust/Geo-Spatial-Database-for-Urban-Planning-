import PopulationData from '../models/PopulationData.js';

// @desc    Get all population data
// @route   GET /api/population
export const getPopulationData = async (req, res, next) => {
  try {
    const { zone_id, year, income_level } = req.query;
    const filter = {};
    if (zone_id) filter.zone_id = zone_id;
    if (year) filter.year = year;
    if (income_level) filter.income_level = income_level;

    const data = await PopulationData.find(filter).populate('zone_id', 'name zone_type').sort('zone_name');
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Get population by zone
// @route   GET /api/population/zone/:zoneId
export const getPopulationByZone = async (req, res, next) => {
  try {
    const data = await PopulationData.findOne({ zone_id: req.params.zoneId }).populate('zone_id');
    if (!data) {
      return res.status(404).json({ success: false, message: 'Population data not found for this zone' });
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Create population data
// @route   POST /api/population
export const createPopulationData = async (req, res, next) => {
  try {
    const data = await PopulationData.create(req.body);
    res.status(201).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Update population data
// @route   PUT /api/population/:id
export const updatePopulationData = async (req, res, next) => {
  try {
    const data = await PopulationData.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Population data not found' });
    }
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete population data
// @route   DELETE /api/population/:id
export const deletePopulationData = async (req, res, next) => {
  try {
    const data = await PopulationData.findByIdAndDelete(req.params.id);
    if (!data) {
      return res.status(404).json({ success: false, message: 'Population data not found' });
    }
    res.json({ success: true, message: 'Population data deleted' });
  } catch (error) {
    next(error);
  }
};
