import mongoose from 'mongoose';

const savedAreaSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    area_name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
    },
    display_name: {
      type: String,
      default: '',
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
      },
    },
    bounding_box: {
      type: [Number], // [south, north, west, east]
      default: [],
    },
    radius: {
      type: Number,
      default: 5000, // meters
    },
    geojson: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    city: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['search', 'map_click', 'import'],
      default: 'search',
    },
    last_analysis_score: {
      type: Number,
      default: null,
    },
    landmark_count: {
      type: Number,
      default: 0,
    },
    road_count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

savedAreaSchema.index({ coordinates: '2dsphere' });
savedAreaSchema.index({ user_id: 1, created_at: -1 });
savedAreaSchema.index({ city: 1 });

export default mongoose.model('SavedArea', savedAreaSchema);
