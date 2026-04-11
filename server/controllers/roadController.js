import Road from '../models/Road.js';

// @desc    Get all roads
// @route   GET /api/roads
export const getRoads = async (req, res, next) => {
  try {
    const { road_type, status } = req.query;
    const filter = {};
    if (road_type) filter.road_type = road_type;
    if (status) filter.status = status;

    const roads = await Road.find(filter).sort('name');
    res.json({ success: true, count: roads.length, data: roads });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single road
// @route   GET /api/roads/:id
export const getRoad = async (req, res, next) => {
  try {
    const road = await Road.findById(req.params.id);
    if (!road) {
      return res.status(404).json({ success: false, message: 'Road not found' });
    }
    res.json({ success: true, data: road });
  } catch (error) {
    next(error);
  }
};

// @desc    Create road
// @route   POST /api/roads
export const createRoad = async (req, res, next) => {
  try {
    const road = await Road.create(req.body);
    res.status(201).json({ success: true, data: road });
  } catch (error) {
    next(error);
  }
};

// @desc    Update road
// @route   PUT /api/roads/:id
export const updateRoad = async (req, res, next) => {
  try {
    const road = await Road.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!road) {
      return res.status(404).json({ success: false, message: 'Road not found' });
    }
    res.json({ success: true, data: road });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete road
// @route   DELETE /api/roads/:id
export const deleteRoad = async (req, res, next) => {
  try {
    const road = await Road.findByIdAndDelete(req.params.id);
    if (!road) {
      return res.status(404).json({ success: false, message: 'Road not found' });
    }
    res.json({ success: true, message: 'Road deleted' });
  } catch (error) {
    next(error);
  }
};
