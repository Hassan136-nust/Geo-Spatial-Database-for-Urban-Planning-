import mongoose from 'mongoose';

const comparisonAreaSchema = new mongoose.Schema(
  {
    area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedArea',
      required: true,
    },
    area_name: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    coverage_summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

const areaComparisonSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Comparison name is required'],
      trim: true,
    },
    areas: {
      type: [comparisonAreaSchema],
      validate: {
        validator: function (v) {
          return v.length >= 2;
        },
        message: 'At least 2 areas are required for comparison',
      },
    },
    winner_area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedArea',
      default: null,
    },
    comparison_metrics: {
      healthcare: { type: mongoose.Schema.Types.Mixed, default: {} },
      education: { type: mongoose.Schema.Types.Mixed, default: {} },
      green_space: { type: mongoose.Schema.Types.Mixed, default: {} },
      connectivity: { type: mongoose.Schema.Types.Mixed, default: {} },
      safety: { type: mongoose.Schema.Types.Mixed, default: {} },
      overall: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

areaComparisonSchema.index({ user_id: 1, created_at: -1 });

export default mongoose.model('AreaComparison', areaComparisonSchema);
