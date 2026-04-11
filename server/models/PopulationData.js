import mongoose from 'mongoose';

const populationDataSchema = new mongoose.Schema(
  {
    zone_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zone',
      required: true,
    },
    zone_name: {
      type: String,
      required: true,
    },
    population_count: {
      type: Number,
      required: true,
      default: 0,
    },
    age_distribution: {
      children: { type: Number, default: 0 },
      youth: { type: Number, default: 0 },
      adults: { type: Number, default: 0 },
      seniors: { type: Number, default: 0 },
    },
    household_count: {
      type: Number,
      default: 0,
    },
    growth_rate: {
      type: Number,
      default: 0,
    },
    income_level: {
      type: String,
      enum: ['low', 'lower_middle', 'middle', 'upper_middle', 'high'],
      default: 'middle',
    },
    employment_rate: {
      type: Number,
      default: 0,
    },
    literacy_rate: {
      type: Number,
      default: 0,
    },
    year: {
      type: Number,
      default: 2026,
    },
  },
  { timestamps: true }
);

export default mongoose.model('PopulationData', populationDataSchema);
