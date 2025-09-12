// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');

// List notifications (query by unread or eventType)
router.get('/', async (req, res) => {
  const { unread, limit = 50 } = req.query;
  const filter = {};
  if (unread === 'true') filter.read = false;
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
  res.json({ data: items });
});

// Create a notification (used by jobs or other routes)
router.post('/', async (req, res) => {
  const doc = await Notification.create(req.body);
  // If streaming (SSE) is enabled, broadcast here
  req.app.get('notifyBroadcast')?.(doc);
  res.status(201).json({ data: doc });
});

// Mark one as read
router.patch('/:id/read', async (req, res) => {
  const doc = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
  res.json({ data: doc });
});

// Mark all as read
router.patch('/mark-all-read', async (req, res) => {
  await Notification.updateMany({ read: false }, { read: true });
  res.json({ ok: true });
});

module.exports = router;
