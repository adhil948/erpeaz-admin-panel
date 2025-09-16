// routes/subscription.js
const express = require('express');
const SiteSubscription = require('../models/siteSubscription');
const { addDays, addMonths, planMonths, TRIAL_DAYS } = require('../utils/time');

const router = express.Router({ mergeParams: true });

// GET /api/sites/:siteId/subscription
router.get('/', async (req, res) => {
  try {
    const doc = await SiteSubscription.findOne({ siteId: req.params.siteId });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// POST /api/sites/:siteId/subscription  (initialize if missing)
router.post('/', async (req, res) => {
  try {
    const { plan_key, start_at } = req.body;
    if (!plan_key || !start_at) return res.status(400).json({ error: 'plan_key and start_at are required' });

    // upsert-like guard: only create if missing
    const existing = await SiteSubscription.findOne({ siteId: req.params.siteId });
    if (existing) return res.status(409).json({ error: 'Already initialized' });

    const start = new Date(start_at);
    const trialEnd = addDays(start, TRIAL_DAYS);
    const months = planMonths(String(plan_key).toLowerCase());
    const expiry = addMonths(trialEnd, months);

    const doc = await SiteSubscription.create({
      siteId: req.params.siteId,
      plan_key: String(plan_key).toLowerCase(),
      start_at: start,
      trial_end_at: trialEnd,
      expiry_at: expiry,
      renewal_history: [],
    });
    res.status(201).json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to initialize subscription' });
  }
});

// PATCH /api/sites/:siteId/subscription (renew current term)
router.patch('/', async (req, res) => {
  try {
    const { action, months: bodyMonths, actor } = req.body || {};
    if (action !== 'renew') return res.status(400).json({ error: 'Unsupported action' });

    const doc = await SiteSubscription.findOne({ siteId: req.params.siteId });
    if (!doc) return res.status(404).json({ error: 'Subscription not found' });

    const now = new Date();
    const months = Number.isFinite(bodyMonths) && bodyMonths > 0
      ? Math.floor(bodyMonths)
      : planMonths(doc.plan_key);

    const base = doc.expiry_at > now ? doc.expiry_at : now;
    const newExpiry = addMonths(base, months);

    const event = {
      type: 'RENEW',
      months,
      old_expiry_at: doc.expiry_at,
      new_expiry_at: newExpiry,
      actor: actor || 'system',
    };

    doc.expiry_at = newExpiry;
    doc.renewed_at = now;
    doc.renewal_history.push(event);

    await doc.save();
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to renew subscription' });
  }
});

module.exports = router;
