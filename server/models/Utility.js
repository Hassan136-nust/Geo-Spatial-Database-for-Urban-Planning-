import mongoose from 'mongoose';

const utilitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Utility name is required'],
      trim: true,
    },
    utility_type: {
      type: String,
      required: true,
      enum: ['water', 'electricity', 'gas', 'sewage', 'telecom', 'fiber'],
    },
    geometry: {
      type: {
        type: String,
        enum: ['LineString', 'Polygon'],
        required: true,
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
    coverage_area: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'maintenance', 'offline', 'planned'],
      default: 'active',
    },
    last_maintenance: {
      type: Date,
      default: Date.now,
    },
    capacity: {
      type: String,
      default: '',
    },
    provider: {
      type: String,
      default: '',
    },
    length_km: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

utilitySchema.index({ geometry: '2dsphere' });

export default mongoose.model('Utility', utilitySchema);
