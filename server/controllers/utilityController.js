import Utility from '../models/Utility.js';

// @desc    Get all utilities
// @route   GET /api/utilities
export const getUtilities = async (req, res, next) => {
  try {
    const { utility_type, status } = req.query;
    const filter = {};
    if (utility_type) filter.utility_type = utility_type;
    if (status) filter.status = status;

    const utilities = await Utility.find(filter).sort('name');
    res.json({ success: true, count: utilities.length, data: utilities });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single utility
// @route   GET /api/utilities/:id
export const getUtility = async (req, res, next) => {
  try {
    const utility = await Utility.findById(req.params.id);
    if (!utility) {
      return res.status(404).json({ success: false, message: 'Utility not found' });
    }
    res.json({ success: true, data: utility });
  } catch (error) {
    next(error);
  }
};

// @desc    Create utility
// @route   POST /api/utilities
export const createUtility = async (req, res, next) => {
  try {
    const utility = await Utility.create(req.body);
    res.status(201).json({ success: true, data: utility });
  } catch (error) {
    next(error);
  }
};

// @desc    Update utility
// @route   PUT /api/utilities/:id
export const updateUtility = async (req, res, next) => {
  try {
    const utility = await Utility.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!utility) {
      return res.status(404).json({ success: false, message: 'Utility not found' });
    }
    res.json({ success: true, data: utility });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete utility
// @route   DELETE /api/utilities/:id
export const deleteUtility = async (req, res, next) => {
  try {
    const utility = await Utility.findByIdAndDelete(req.params.id);
    if (!utility) {
      return res.status(404).json({ success: false, message: 'Utility not found' });
    }
    res.json({ success: true, message: 'Utility deleted' });
  } catch (error) {
    next(error);
  }
};
