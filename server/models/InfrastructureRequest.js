import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    vote: {
      type: String,
      enum: ['upvote', 'downvote'],
      required: true,
    },
  },
  { _id: false }
);

const infrastructureRequestSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: 2000,
    },
    request_type: {
      type: String,
      required: true,
      enum: ['hospital', 'school', 'park', 'road', 'police', 'fire_station', 'mosque', 'library', 'other'],
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'completed'],
      default: 'pending',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedArea',
      default: null,
    },
    city: {
      type: String,
      default: '',
    },
    justification: {
      type: String,
      default: '',
    },
    supporting_data: {
      nearest_existing_km: { type: Number, default: null },
      population_coverage: { type: Number, default: null },
      gap_score: { type: Number, default: null },
    },
    votes: [voteSchema],
    vote_count: {
      type: Number,
      default: 0,
    },
    admin_notes: {
      type: String,
      default: '',
    },
    reviewed_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewed_at: {
      type: Date,
      default: null,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

infrastructureRequestSchema.index({ location: '2dsphere' });
infrastructureRequestSchema.index({ status: 1, priority: -1 });
infrastructureRequestSchema.index({ city: 1, request_type: 1 });
infrastructureRequestSchema.index({ user_id: 1, created_at: -1 });
infrastructureRequestSchema.index({ vote_count: -1 });

export default mongoose.model('InfrastructureRequest', infrastructureRequestSchema);
