import mongoose from 'mongoose';

const roadSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Road name is required'],
      trim: true,
    },
    road_type: {
      type: String,
      required: true,
      enum: ['highway', 'arterial', 'collector', 'local', 'expressway'],
    },
    geometry: {
      type: {
        type: String,
        enum: ['LineString'],
        required: true,
      },
      coordinates: {
        type: [[Number]],
        required: true,
      },
    },
    length_km: {
      type: Number,
      default: 0,
    },
    traffic_capacity: {
      type: Number,
      default: 0,
    },
    lanes: {
      type: Number,
      default: 2,
    },
    status: {
      type: String,
      enum: ['operational', 'under_construction', 'planned', 'maintenance'],
      default: 'operational',
    },
    speed_limit: {
      type: Number,
      default: 60,
    },
    surface_type: {
      type: String,
      enum: ['asphalt', 'concrete', 'unpaved'],
      default: 'asphalt',
    },
  },
  { timestamps: true }
);

roadSchema.index({ geometry: '2dsphere' });

export default mongoose.model('Road', roadSchema);
