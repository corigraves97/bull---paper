// src/models/journal.js
import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  symbol: { type: String, required: true, uppercase: true, index: true },
  side: { type: String, enum: ['long', 'short'], required: true },
  timeOfDay: { type: timestamps, required: true, index: true },
  shareSize: { type: Number, required: true },
  entry: { type: Number, required: true },
  exit: { type: Number, required: true },
  volume: { type: Number, enum: ['1m - 5m', '10m - 20m', '30m - 40m', '50m - 70m', '80m - 100m', '120m - 150m', '160m - 180m', '200+m'], required: true },
  fees: { type: Number, default: 0 },// Fees associated with the trade, defaulting to 0 if not provided
  meta: { // Optional metadata about the trade. metadata is an object that can contain any additional information about the trade.
    strategyTag: String
  },
  notes: { type: String,  } 
});

positionSchema.index({ userId: 1, symbol: 1 }, { unique: true });
// Compound index to ensure a user can't have multiple open positions for the same symbol
positionSchema.index({ userId: 1, timeOfDay: -1 });
// Index to optimize queries for a user's positions sorted by timeOfDay 


export default mongoose.model('Position', positionSchema);