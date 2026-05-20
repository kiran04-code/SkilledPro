const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  selectedWorker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  title: { type: String, required: true },
  description: { type: String, required: true },
  skill: { type: String, required: true },
  location: { type: String, required: true },
  locationCoords: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] } // [longitude, latitude]
  },
  budget: { type: Number, required: true, min: 1 },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'closed', 'cancelled'],
    default: 'open'
  },
  agreedPrice: { type: Number, default: 0, min: 0 },
  revisedPrice: { type: Number, default: 0, min: 0 },
  revisionStatus: { type: String, enum: ['none', 'pending', 'accepted', 'rejected'], default: 'none' },
  revisionCount: { type: Number, default: 0 },
  maxRevisions: { type: Number, default: 3 },
  finalPrice: { type: Number, default: 0, min: 0 },
  platformFee: { type: Number, default: 0, min: 0 },
  workerEarnings: { type: Number, default: 0, min: 0 },
  escrowPaid: { type: Boolean, default: false },
  paymentReleased: { type: Boolean, default: false },
  contactRevealed: { type: Boolean, default: false },
  workCompletedByWorker: { type: Boolean, default: false },
  cancelledBy: { type: String, enum: ['client', 'worker', null], default: null },
  cancellationReason: { type: String, default: '' },
  refundIssued: { type: Boolean, default: false },
  submittedWork: [{ type: String }],
}, { timestamps: true });

projectSchema.index({ locationCoords: '2dsphere' });
projectSchema.index({ client: 1 });
projectSchema.index({ selectedWorker: 1 });
projectSchema.index({ status: 1, skill: 1 });

module.exports = mongoose.model('Project', projectSchema);