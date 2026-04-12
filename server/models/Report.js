import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    area_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavedArea',
      default: null,
    },
    area_name: {
      type: String,
      required: [true, 'Area name is required'],
      trim: true,
    },
    center: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    radius: {
      type: Number,
      default: 5000,
    },
    score: {
      type: Number,
      default: 0,
    },
    rating: {
      type: String,
      default: '',
    },
    pdf_path: {
      type: String,
      default: '',
    },
    file_size: {
      type: Number,
      default: 0,
    },
    report_type: {
      type: String,
      enum: ['area_analysis', 'planner_evaluation', 'comparison'],
      default: 'area_analysis',
    },
  },
  { timestamps: { createdAt: 'generated_at', updatedAt: 'updated_at' } }
);

reportSchema.index({ user_id: 1, generated_at: -1 });

export default mongoose.model('Report', reportSchema);
