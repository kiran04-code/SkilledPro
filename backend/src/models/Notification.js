const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['payment_received', 'bid_accepted', 'bid_closed', 'new_bid', 'work_completed', 'revision_request', 'revision_response', 'review_received'],
    required: true
  },
  message: { type: String, required: true },
  amount: { type: Number, default: 0 },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  read: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);