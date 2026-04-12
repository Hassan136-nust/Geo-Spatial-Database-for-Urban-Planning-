import ProjectWorkspace from '../models/ProjectWorkspace.js';
import { logActivity } from '../services/activityService.js';

// @desc    Create project
// @route   POST /api/projects
export const createProject = async (req, res, next) => {
  try {
    const { name, description, color, tags } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Project name is required' });

    const project = await ProjectWorkspace.create({
      user_id: req.user.id, name, description, color, tags,
    });

    logActivity(req.user.id, 'create_project', 'project', project._id, { name }, req);
    res.status(201).json({ success: true, data: project });
  } catch (error) { next(error); }
};

// @desc    Get user projects
// @route   GET /api/projects
export const getProjects = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { $or: [{ user_id: req.user.id }, { 'collaborators.user_id': req.user.id }] };
    if (status) filter.status = status;

    const projects = await ProjectWorkspace.find(filter)
      .sort({ updated_at: -1 })
      .populate('areas', 'area_name last_analysis_score')
      .populate('designs', 'design_name evaluation_score')
      .populate('reports', 'area_name score')
      .lean();

    res.json({ success: true, count: projects.length, data: projects });
  } catch (error) { next(error); }
};

// @desc    Get single project
// @route   GET /api/projects/:id
export const getProject = async (req, res, next) => {
  try {
    const project = await ProjectWorkspace.findById(req.params.id)
      .populate('areas')
      .populate('designs')
      .populate('reports')
      .populate('collaborators.user_id', 'name email');

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

// @desc    Update project
// @route   PUT /api/projects/:id
export const updateProject = async (req, res, next) => {
  try {
    const { name, description, status, color, tags } = req.body;
    const update = {};
    if (name) update.name = name;
    if (description !== undefined) update.description = description;
    if (status) update.status = status;
    if (color) update.color = color;
    if (tags) update.tags = tags;

    const project = await ProjectWorkspace.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    logActivity(req.user.id, 'update_project', 'project', project._id, {}, req);
    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

// @desc    Add/remove items from project
// @route   PUT /api/projects/:id/items
export const updateProjectItems = async (req, res, next) => {
  try {
    const { action, type, itemId } = req.body; // action: 'add' | 'remove', type: 'areas' | 'designs' | 'reports'
    if (!['add', 'remove'].includes(action) || !['areas', 'designs', 'reports'].includes(type) || !itemId) {
      return res.status(400).json({ success: false, message: 'Provide action (add/remove), type (areas/designs/reports), and itemId' });
    }

    const update = action === 'add'
      ? { $addToSet: { [type]: itemId } }
      : { $pull: { [type]: itemId } };

    const project = await ProjectWorkspace.findOneAndUpdate(
      { _id: req.params.id, user_id: req.user.id },
      update,
      { new: true }
    );

    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Update item count
    project.item_count = project.areas.length + project.designs.length + project.reports.length;
    await project.save();

    res.json({ success: true, data: project });
  } catch (error) { next(error); }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
export const deleteProject = async (req, res, next) => {
  try {
    const project = await ProjectWorkspace.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    res.json({ success: true, message: 'Project deleted' });
  } catch (error) { next(error); }
};
