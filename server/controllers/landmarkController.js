import Landmark from '../models/Landmark.js';

// @desc    Get all landmarks
// @route   GET /api/landmarks
export const getLandmarks = async (req, res, next) => {
  try {
    const { type, status, subtype } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (subtype) filter.subtype = subtype;

    const landmarks = await Landmark.find(filter).sort('name');
    res.json({ success: true, count: landmarks.length, data: landmarks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single landmark
// @route   GET /api/landmarks/:id
export const getLandmark = async (req, res, next) => {
  try {
    const landmark = await Landmark.findById(req.params.id);
    if (!landmark) {
      return res.status(404).json({ success: false, message: 'Landmark not found' });
    }
    res.json({ success: true, data: landmark });
  } catch (error) {
    next(error);
  }
};

// @desc    Create landmark
// @route   POST /api/landmarks
export const createLandmark = async (req, res, next) => {
  try {
    const landmark = await Landmark.create(req.body);
    res.status(201).json({ success: true, data: landmark });
  } catch (error) {
    next(error);
  }
};

// @desc    Update landmark
// @route   PUT /api/landmarks/:id
export const updateLandmark = async (req, res, next) => {
  try {
    const landmark = await Landmark.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!landmark) {
      return res.status(404).json({ success: false, message: 'Landmark not found' });
    }
    res.json({ success: true, data: landmark });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete landmark
// @route   DELETE /api/landmarks/:id
export const deleteLandmark = async (req, res, next) => {
  try {
    const landmark = await Landmark.findByIdAndDelete(req.params.id);
    if (!landmark) {
      return res.status(404).json({ success: false, message: 'Landmark not found' });
    }
    res.json({ success: true, message: 'Landmark deleted' });
  } catch (error) {
    next(error);
  }
};
