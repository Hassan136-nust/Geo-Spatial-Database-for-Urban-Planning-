import mongoose from 'mongoose';

const analyticsResultSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedArea',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rating: {
      type: String,
      default: '',
    },
    coverage_data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    strengths: [
      {
        type: { type: String },
        message: String,
        score: Number,
        icon: String,
      },
    ],
    weaknesses: [
      {
        type: { type: String },
        message: String,
        score: Number,
        severity: String,
        icon: String,
      },
    ],
    recommendations: [
      {
        priority: String,
        category: String,
        message: String,
        icon: String,
      },
    ],
    scoring: {
      rawScore: { type: Number, default: 0 },
      roadScore: { type: Number, default: 0 },
      diversityScore: { type: Number, default: 0 },
      penalties: { type: mongoose.Schema.Types.Mixed, default: [] },
    },
    density: {
      placesPerSqKm: { type: String, default: '0' },
    },
    total_places: {
      type: Number,
      default: 0,
    },
    gaps: [
      {
        type: { type: String },
        severity: String,
        message: String,
        count: Number,
      },
    ],
    radius_km: {
      type: Number,
      default: 5,
    },
    center: {
      lat: Number,
      lng: Number,
    },
  },
  { timestamps: { createdAt: 'timestamp', updatedAt: 'updated_at' } }
);

analyticsResultSchema.index({ area_id: 1 });
analyticsResultSchema.index({ user_id: 1, timestamp: -1 });

export default mongoose.model('AnalyticsResult', analyticsResultSchema);
