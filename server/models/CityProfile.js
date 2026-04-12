import mongoose from 'mongoose';

const cityProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'City name is required'],
      trim: true,
    },
    display_name: {
      type: String,
      default: '',
    },
    country: {
      type: String,
      default: '',
    },
    country_code: {
      type: String,
      default: '',
      uppercase: true,
    },
    state: {
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
        type: [Number],
        required: true,
      },
    },
    bounding_box: {
      type: [Number],
      default: [],
    },
    population: {
      type: Number,
      default: 0,
    },
    area_sqkm: {
      type: Number,
      default: 0,
    },
    timezone: {
      type: String,
      default: '',
    },
    landmark_count: {
      type: Number,
      default: 0,
    },
    road_count: {
      type: Number,
      default: 0,
    },
    last_data_fetch: {
      type: Date,
      default: null,
    },
    osm_id: {
      type: Number,
      default: null,
    },
    category: {
      type: String,
      enum: ['city', 'town', 'village', 'suburb', 'county', 'state', 'country', 'residential', 'administrative', 'neighbourhood', 'hamlet', 'district', 'municipality', 'quarter', 'borough', 'other'],
      default: 'city',
    },
    tags: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    search_count: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

cityProfileSchema.index({ coordinates: '2dsphere' });
cityProfileSchema.index({ name: 1, country_code: 1 }, { unique: true });
cityProfileSchema.index({ search_count: -1 });

export default mongoose.model('CityProfile', cityProfileSchema);
