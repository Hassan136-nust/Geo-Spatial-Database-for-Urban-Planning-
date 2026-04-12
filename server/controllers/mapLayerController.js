import MapLayer from '../models/MapLayer.js';
import { logActivity } from '../services/activityService.js';

// @desc    Create map layer
// @route   POST /api/map-layers
export const createLayer = async (req, res, next) => {
  try {
    const { name, description, layer_type, visibility, style, features } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Layer name is required' });

    const layer = await MapLayer.create({
      user_id: req.user.id, name, description, layer_type, visibility, style,
      features: features || [],
      feature_count: features?.length || 0,
    });

    logActivity(req.user.id, 'create_map_layer', 'map_layer', layer._id, { name }, req);
    res.status(201).json({ success: true, data: layer });
  } catch (error) { next(error); }
};

// @desc    Get user layers
// @route   GET /api/map-layers
export const getLayers = async (req, res, next) => {
  try {
    const layers = await MapLayer.find({ user_id: req.user.id })
      .sort({ updated_at: -1 })
      .select('-features')
      .lean();
    res.json({ success: true, count: layers.length, data: layers });
  } catch (error) { next(error); }
};

// @desc    Get public layers
// @route   GET /api/map-layers/public
export const getPublicLayers = async (req, res, next) => {
  try {
    const layers = await MapLayer.find({ visibility: 'public', is_active: true })
      .sort({ updated_at: -1 })
      .select('-features')
      .populate('user_id', 'name')
      .lean();
    res.json({ success: true, count: layers.length, data: layers });
  } catch (error) { next(error); }
};

// @desc    Get single layer
// @route   GET /api/map-layers/:id
export const getLayer = async (req, res, next) => {
  try {
    const layer = await MapLayer.findById(req.params.id);
    if (!layer) return res.status(404).json({ success: false, message: 'Layer not found' });
    if (layer.visibility === 'private' && layer.user_id.toString() !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: layer });
  } catch (error) { next(error); }
};

// @desc    Update layer
// @route   PUT /api/map-layers/:id
export const updateLayer = async (req, res, next) => {
  try {
    const { name, description, style, visibility, is_active } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (style) update.style = style;
    if (visibility) update.visibility = visibility;
    if (is_active !== undefined) update.is_active = is_active;

    const layer = await MapLayer.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id }, { $set: update }, { new: true }
    );
    if (!layer) return res.status(404).json({ success: false, message: 'Layer not found' });
    logActivity(req.user.id, 'update_map_layer', 'map_layer', layer._id, {}, req);
    res.json({ success: true, data: layer });
  } catch (error) { next(error); }
};

// @desc    Add features to layer
// @route   PUT /api/map-layers/:id/features
export const addFeatures = async (req, res, next) => {
  try {
    const { features } = req.body;
    if (!features || !Array.isArray(features)) {
      return res.status(400).json({ success: false, message: 'Provide features array' });
    }

    const layer = await MapLayer.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $push: { features: { $each: features } }, $inc: { feature_count: features.length } },
      { new: true }
    );
    if (!layer) return res.status(404).json({ success: false, message: 'Layer not found' });
    res.json({ success: true, data: layer });
  } catch (error) { next(error); }
};

// @desc    Delete layer
// @route   DELETE /api/map-layers/:id
export const deleteLayer = async (req, res, next) => {
  try {
    const layer = await MapLayer.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!layer) return res.status(404).json({ success: false, message: 'Layer not found' });
    res.json({ success: true, message: 'Layer deleted' });
  } catch (error) { next(error); }
};
