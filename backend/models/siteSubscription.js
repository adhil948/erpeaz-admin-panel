// models/siteSubscription.js
const mongoose = require('mongoose');

const SubscriptionEventSchema = new mongoose.Schema({
  type: { type: String, enum: ['RENEW', 'PLAN_CHANGE'], required: true },
  months: { type: Number }, // e.g., 6 or 12
  old_expiry_at: { type: Date },
  new_expiry_at: { type: Date },
  actor: { type: String },   // optional user id/name
  meta: { type: Object },    // optional metadata
  occurred_at: { type: Date, default: () => new Date() },
}, { _id: false });

const SiteSubscriptionSchema = new mongoose.Schema({
  siteId: { type: String, required: true, unique: true, index: true },
  plan_key: { 
    type: String, 
    enum: ['Basic','Professional','Premium','Ultimate','Enterprise'], 
    required: true 
  },
  start_at: { type: Date, required: true },        // UTC
  trial_end_at: { type: Date, required: true },    // start_at + 14 days
  expiry_at: { type: Date, required: true },       // trial_end_at + 6 or 12 months
  renewed_at: { type: Date },                      // last renewal timestamp
  renewal_history: { type: [SubscriptionEventSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('SiteSubscription', SiteSubscriptionSchema);
