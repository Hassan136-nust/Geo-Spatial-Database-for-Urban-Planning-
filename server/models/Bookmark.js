import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    resource_type: {
      type: String,
      required: true,
      enum: ['landmark', 'area', 'design', 'city', 'report'],
    },
    resource_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    resource_name: {
      type: String,
      default: '',
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    notes: {
      type: String,
      default: '',
      maxlength: 500,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

bookmarkSchema.index({ user_id: 1, resource_type: 1 });
bookmarkSchema.index({ user_id: 1, resource_type: 1, resource_id: 1 }, { unique: true });
bookmarkSchema.index({ location: '2dsphere' });

export default mongoose.model('Bookmark', bookmarkSchema);
