import mongoose from 'mongoose';

const landmarkSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Landmark name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['hospital', 'school', 'university', 'park', 'government', 'religious', 'commercial', 'monument', 'other'],
    },
    subtype: {
      type: String,
      default: '',
    },
    geometry: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    service_radius_km: {
      type: Number,
      default: 2,
    },
    capacity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['operational', 'under_construction', 'closed', 'planned'],
      default: 'operational',
    },
    address: {
      type: String,
      default: '',
    },
    contact: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    image_url: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

landmarkSchema.index({ geometry: '2dsphere' });

export default mongoose.model('Landmark', landmarkSchema);
