import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
  },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'error', 'system'],
    default: 'info',
  },
  category: {
    type: String,
    enum: [
      'analysis_complete', 'report_ready', 'design_saved',
      'infra_request_update', 'project_update', 'system_update',
      'welcome', 'achievement',
    ],
    default: 'system_update',
  },
  link: {
    type: String,
    default: '',
  },
  resource_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  is_read: {
    type: Boolean,
    default: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });
// Auto-delete notifications older than 30 days
notificationSchema.index({ created_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model('Notification', notificationSchema);
