import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'search_area', 'save_design', 'update_design', 'delete_design',
      'generate_report', 'download_report',
      'add_landmark', 'add_bookmark', 'remove_bookmark',
      'create_project', 'update_project',
      'compare_areas', 'submit_infra_request', 'vote_infra_request',
      'create_map_layer', 'update_map_layer',
      'login', 'register', 'update_profile',
      'export_geojson', 'import_geojson',
    ],
  },
  resource_type: {
    type: String,
    enum: ['area', 'design', 'report', 'landmark', 'auth', 'bookmark', 'project', 'comparison', 'infra_request', 'map_layer', 'city'],
    default: 'area',
  },
  resource_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ip_address: {
    type: String,
    default: '',
  },
  user_agent: {
    type: String,
    default: '',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

activityLogSchema.index({ user_id: 1, timestamp: -1 });
activityLogSchema.index({ action: 1, timestamp: -1 });
// Auto-delete logs older than 90 days
activityLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model('ActivityLog', activityLogSchema);
