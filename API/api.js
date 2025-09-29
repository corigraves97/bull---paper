import mongoose from 'mongoose';

const api = mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  symbol: { type: String, required: true, uppercase: true, index: true },
  priceRange: { type: Number, required: true, min: 0 },
  shortFloat: { type: Number, required: true, min: 0 }, 
  executedDay: { type: Date, required: true, index: true },
  avgVolume: { type: Number, required: true, min: 0 },
  avgTrueRange: { type: Number, required: true, min: 0 },
  typeIndustry: { type: String, required: true },
  marketCap: { type: Number, required: true, min: 0 },
  newsSentiment: { type: Number, required: true },
  sharesOutstanding: { type: Number, required: true, min: 0 },
  institutionalOwnership: { type: Number, required: true, min: 0 },

  timestamps: true
});



api.index({ userId: 1, executedDay: -1 });
// To optimize queries for a user's trades sorted by executedDay
api.index({ symbol: 1, executedDay: -1 });
// To optimize queries filtering by symbol and sorting by executedDay

export default mongoose.model('Trade', api);