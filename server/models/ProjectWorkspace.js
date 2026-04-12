import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['editor', 'viewer'],
      default: 'viewer',
    },
    added_at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const projectWorkspaceSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'completed'],
      default: 'active',
    },
    areas: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SavedArea',
      },
    ],
    designs: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlannerDesign',
      },
    ],
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
      },
    ],
    collaborators: [collaboratorSchema],
    tags: [String],
    color: {
      type: String,
      default: '#0ea5e9',
    },
    item_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

projectWorkspaceSchema.index({ user_id: 1, status: 1 });
projectWorkspaceSchema.index({ 'collaborators.user_id': 1 });

export default mongoose.model('ProjectWorkspace', projectWorkspaceSchema);
