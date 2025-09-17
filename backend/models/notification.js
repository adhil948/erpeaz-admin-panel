// models/Notification.js
const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema(
  {
    eventType: { type: String, enum: [    "site_created",
    "trial_ending",
    "trial_ended",
    "basic_plan_ending",
    "basic_plan_expired",
    "plan_expired",], required: true },
    siteId: { type: String, index: true },
    siteName: String,
    severity: { type: String, enum: ['success', 'info', 'warning', 'error'], required: true },
    title: String,
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    meta: mongoose.Schema.Types.Mixed,
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// Optional: auto-delete notifications after 30 days
// NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 3600 });

module.exports = mongoose.model('Notification', NotificationSchema);
