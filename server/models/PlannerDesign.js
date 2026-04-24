import mongoose from 'mongoose';

const plannerElementSchema = new mongoose.Schema(
  {
    element_id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['house', 'residential', 'hospital', 'school', 'park', 'road', 'mosque', 'mall', 'police', 'industrial', 'fire_station', 'university', 'other'],
    },
    lat: {
      type: Number,
      required: true,
    },
    lng: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const plannerDesignSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    design_name: {
      type: String,
      required: [true, 'Design name is required'],
      trim: true,
      maxlength: 100,
    },
    center: {
      lat: { type: Number, default: 33.6844 },
      lng: { type: Number, default: 73.0479 },
    },
    radius: {
      type: Number,
      default: 5,
    },
    elements: [plannerElementSchema],
    evaluation_score: {
      type: Number,
      default: null,
    },
    evaluation_result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    feedback: {
      type: String,
      default: '',
    },
    element_count: {
      type: Number,
      default: 0,
    },
    thumbnail_data: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

plannerDesignSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model('PlannerDesign', plannerDesignSchema);
