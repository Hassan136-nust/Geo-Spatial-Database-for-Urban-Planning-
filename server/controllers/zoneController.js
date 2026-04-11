import Zone from '../models/Zone.js';

// @desc    Get all zones
// @route   GET /api/zones
export const getZones = async (req, res, next) => {
  try {
    const { zone_type, status } = req.query;
    const filter = {};
    if (zone_type) filter.zone_type = zone_type;
    if (status) filter.status = status;

    const zones = await Zone.find(filter).sort('name');
    res.json({ success: true, count: zones.length, data: zones });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single zone
// @route   GET /api/zones/:id
export const getZone = async (req, res, next) => {
  try {
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

// @desc    Create zone
// @route   POST /api/zones
export const createZone = async (req, res, next) => {
  try {
    const zone = await Zone.create(req.body);
    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

// @desc    Update zone
// @route   PUT /api/zones/:id
export const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, data: zone });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete zone
// @route   DELETE /api/zones/:id
export const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    res.json({ success: true, message: 'Zone deleted' });
  } catch (error) {
    next(error);
  }
};
