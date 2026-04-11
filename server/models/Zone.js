import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      unique: true,
      trim: true,
    },
    zone_type: {
      type: String,
      required: true,
      enum: ['residential', 'commercial', 'industrial', 'green', 'institutional', 'mixed'],
    },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon'],
        required: true,
      },
      coordinates: {
        type: [[[Number]]],
        required: true,
      },
    },
    population_density: {
      type: Number,
      default: 0,
    },
    zoning_code: {
      type: String,
      default: '',
    },
    land_use_type: {
      type: String,
      default: '',
    },
    area_sqkm: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'planned', 'under_development'],
      default: 'active',
    },
    color: {
      type: String,
      default: '#4488ff',
    },
  },
  { timestamps: true }
);

zoneSchema.index({ geometry: '2dsphere' });

export default mongoose.model('Zone', zoneSchema);
