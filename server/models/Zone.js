import mongoose from 'mongoose';

const zoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Zone name is required'],
      trim: true,
    },
    zone_type: {
      type: String,
      required: true,
      enum: ['residential', 'commercial', 'industrial', 'green', 'institutional', 'mixed', 'administrative'],
    },
    geometry: {
      type: {
        type: String,
        enum: ['Polygon', 'MultiPolygon'],
        required: true,
      },
      coordinates: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
      },
    },
    center: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    osm_id: {
      type: Number,
      default: null,
      sparse: true,
    },
    admin_level: {
      type: Number,
      default: null,
    },
    source: {
      type: String,
      enum: ['manual', 'osm'],
      default: 'manual',
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
zoneSchema.index({ osm_id: 1 }, { unique: true, sparse: true, partialFilterExpression: { osm_id: { $ne: null } } });

export default mongoose.model('Zone', zoneSchema);
