import PlannerDesign from '../models/PlannerDesign.js';
import { evaluateLayout } from '../services/analysisService.js';
import { logActivity } from '../services/activityService.js';
import { notify } from '../services/notificationService.js';

// @desc    Save a planner design
// @route   POST /api/planner/save
export const saveDesign = async (req, res, next) => {
  try {
    const { design_name, elements, center, designId } = req.body;

    if (!design_name) {
      return res.status(400).json({ success: false, message: 'Design name is required' });
    }
    if (!elements || !Array.isArray(elements) || elements.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one element is required' });
    }

    // Run evaluation
    const centerLat = center?.lat || elements.reduce((s, e) => s + e.lat, 0) / elements.length;
    const centerLng = center?.lng || elements.reduce((s, e) => s + e.lng, 0) / elements.length;
    const evaluation = evaluateLayout(elements, centerLat, centerLng);

    const designData = {
      user_id: req.user.id,
      design_name,
      center: { lat: centerLat, lng: centerLng },
      elements: elements.map((e) => ({
        element_id: e.id || e.element_id || `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: e.type,
        lat: e.lat,
        lng: e.lng,
      })),
      evaluation_score: evaluation.score,
      evaluation_result: evaluation,
      element_count: elements.length,
    };

    let design;
    if (designId) {
      // Update existing
      design = await PlannerDesign.findOneAndUpdate(
        { _id: designId, user_id: req.user.id },
        { $set: designData },
        { new: true, runValidators: true }
      );
      if (!design) {
        return res.status(404).json({ success: false, message: 'Design not found' });
      }
      logActivity(req.user.id, 'update_design', 'design', design._id, { name: design_name }, req);
    } else {
      // Create new
      design = await PlannerDesign.create(designData);
      logActivity(req.user.id, 'save_design', 'design', design._id, { name: design_name }, req);
      notify(req.user.id, 'Design Saved 📐', `"${design_name}" scored ${evaluation.score}/100`, {
        type: 'success',
        category: 'design_saved',
        link: '/my-designs',
        resourceId: design._id,
      });
    }

    res.status(designId ? 200 : 201).json({
      success: true,
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all designs for current user
// @route   GET /api/planner/user-designs
export const getUserDesigns = async (req, res, next) => {
  try {
    const designs = await PlannerDesign.find({ user_id: req.user.id })
      .sort({ created_at: -1 })
      .select('-evaluation_result')
      .lean();

    res.json({ success: true, count: designs.length, data: designs });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single design
// @route   GET /api/planner/:id
export const getDesign = async (req, res, next) => {
  try {
    const design = await PlannerDesign.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }
    res.json({ success: true, data: design });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a design
// @route   PUT /api/planner/:id
export const updateDesign = async (req, res, next) => {
  try {
    const { design_name, elements, feedback } = req.body;
    const updateData = {};

    if (design_name) updateData.design_name = design_name;
    if (feedback) updateData.feedback = feedback;

    if (elements && Array.isArray(elements)) {
      updateData.elements = elements.map((e) => ({
        element_id: e.id || e.element_id,
        type: e.type,
        lat: e.lat,
        lng: e.lng,
      }));
      updateData.element_count = elements.length;

      // Re-evaluate
      const centerLat = elements.reduce((s, e) => s + e.lat, 0) / elements.length;
      const centerLng = elements.reduce((s, e) => s + e.lng, 0) / elements.length;
      const evaluation = evaluateLayout(elements, centerLat, centerLng);
      updateData.evaluation_score = evaluation.score;
      updateData.evaluation_result = evaluation;
      updateData.center = { lat: centerLat, lng: centerLng };
    }

    const design = await PlannerDesign.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    logActivity(req.user.id, 'update_design', 'design', design._id, {}, req);

    res.json({ success: true, data: design });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a design
// @route   DELETE /api/planner/:id
export const deleteDesign = async (req, res, next) => {
  try {
    const design = await PlannerDesign.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!design) {
      return res.status(404).json({ success: false, message: 'Design not found' });
    }

    logActivity(req.user.id, 'delete_design', 'design', design._id, {}, req);

    res.json({ success: true, message: 'Design deleted' });
  } catch (error) {
    next(error);
  }
};
