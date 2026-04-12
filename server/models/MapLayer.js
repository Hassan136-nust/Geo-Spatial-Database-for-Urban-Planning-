import mongoose from 'mongoose';

const featureSchema = new mongoose.Schema(
  {
    geometry_type: {
      type: String,
      enum: ['Point', 'LineString', 'Polygon'],
      required: true,
    },
    coordinates: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    properties: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: true }
);

const mapLayerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Layer name is required'],
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      default: '',
      maxlength: 500,
    },
    layer_type: {
      type: String,
      enum: ['markers', 'polygons', 'heatmap', 'routes', 'mixed'],
      default: 'markers',
    },
    visibility: {
      type: String,
      enum: ['private', 'public', 'shared'],
      default: 'private',
    },
    style: {
      color: { type: String, default: '#0ea5e9' },
      opacity: { type: Number, default: 0.8 },
      weight: { type: Number, default: 2 },
      fill_color: { type: String, default: '#0ea5e9' },
      fill_opacity: { type: Number, default: 0.2 },
      icon: { type: String, default: '📍' },
    },
    features: [featureSchema],
    bounds: {
      south: Number,
      north: Number,
      west: Number,
      east: Number,
    },
    feature_count: {
      type: Number,
      default: 0,
    },
    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

mapLayerSchema.index({ user_id: 1, is_active: 1 });
mapLayerSchema.index({ visibility: 1 });

export default mongoose.model('MapLayer', mapLayerSchema);
