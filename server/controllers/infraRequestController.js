import InfrastructureRequest from '../models/InfrastructureRequest.js';
import { logActivity } from '../services/activityService.js';

// @desc    Submit infrastructure request
// @route   POST /api/infra-requests
export const submitRequest = async (req, res, next) => {
  try {
    const { title, description, request_type, priority, lat, lng, city, justification, area_id, supporting_data } = req.body;
    if (!title || !description || !request_type || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Provide title, description, request_type, lat, lng' });
    }

    const request = await InfrastructureRequest.create({
      user_id: req.user.id, title, description, request_type, priority,
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      city, justification, area_id, supporting_data,
    });

    logActivity(req.user.id, 'submit_infra_request', 'infra_request', request._id, { title, type: request_type }, req);
    res.status(201).json({ success: true, data: request });
  } catch (error) { next(error); }
};

// @desc    Get all requests (filterable)
// @route   GET /api/infra-requests
export const getRequests = async (req, res, next) => {
  try {
    const { city, status, request_type, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (city) filter.city = { $regex: new RegExp(city, 'i') };
    if (status) filter.status = status;
    if (request_type) filter.request_type = request_type;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [requests, total] = await Promise.all([
      InfrastructureRequest.find(filter)
        .sort({ vote_count: -1, created_at: -1 })
        .skip(skip).limit(parseInt(limit))
        .populate('user_id', 'name')
        .lean(),
      InfrastructureRequest.countDocuments(filter),
    ]);

    res.json({ success: true, count: requests.length, total, data: requests });
  } catch (error) { next(error); }
};

// @desc    Get current user's requests
// @route   GET /api/infra-requests/mine
export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await InfrastructureRequest.find({ user_id: req.user.id }).sort({ created_at: -1 }).lean();
    res.json({ success: true, count: requests.length, data: requests });
  } catch (error) { next(error); }
};

// @desc    Vote on request
// @route   PUT /api/infra-requests/:id/vote
export const voteRequest = async (req, res, next) => {
  try {
    const { vote } = req.body;
    if (!['upvote', 'downvote'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Vote must be upvote or downvote' });
    }

    const request = await InfrastructureRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // Remove existing vote from this user
    request.votes = request.votes.filter((v) => v.user_id.toString() !== req.user.id);
    request.votes.push({ user_id: req.user.id, vote });
    request.vote_count = request.votes.filter((v) => v.vote === 'upvote').length - request.votes.filter((v) => v.vote === 'downvote').length;
    await request.save();

    logActivity(req.user.id, 'vote_infra_request', 'infra_request', request._id, { vote }, req);
    res.json({ success: true, data: request });
  } catch (error) { next(error); }
};

// @desc    Admin review
// @route   PUT /api/infra-requests/:id/review
export const reviewRequest = async (req, res, next) => {
  try {
    const { status, admin_notes } = req.body;
    if (!['approved', 'rejected', 'under_review'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const request = await InfrastructureRequest.findByIdAndUpdate(
      req.params.id,
      { status, admin_notes, reviewed_by: req.user.id, reviewed_at: new Date() },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, data: request });
  } catch (error) { next(error); }
};

// @desc    Delete request
// @route   DELETE /api/infra-requests/:id
export const deleteRequest = async (req, res, next) => {
  try {
    const request = await InfrastructureRequest.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.json({ success: true, message: 'Request deleted' });
  } catch (error) { next(error); }
};
