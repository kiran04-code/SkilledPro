const mongoose = require('mongoose');

const priceRevisionSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oldPrice: { type: Number, required: true },
  newPrice: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('PriceRevision', priceRevisionSchema);