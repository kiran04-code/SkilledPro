const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  worker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true, min: 1 },
  proposal: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'closed'],
    default: 'pending'
  },
}, { timestamps: true });

bidSchema.index({ project: 1 });
bidSchema.index({ worker: 1 });

module.exports = mongoose.model('Bid', bidSchema);