// jobs/siteNotifications.js
const axios = require('axios');
const cron = require('node-cron');
const Notification = require('../models/notification');
const mongoose = require('mongoose');
const { differenceInDays } = require('date-fns');

// Keep a lightweight cache of seen site IDs to detect "site created"
const SeenSite = mongoose.model('SeenSite', new mongoose.Schema({
  siteId: { type: String, unique: true },
  snapshot: Object,
}, { timestamps: true }));

async function fetchUpstreamSites() {
  const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://api.erpeaz.org/api';
  const EXTERNAL_API_SITES_ENDPOINT = '/site-details';
  const resp = await axios.get(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_SITES_ENDPOINT}`);
  // Adjust path depending on upstream shape
  return Array.isArray(resp.data?.data) ? resp.data.data : (Array.isArray(resp.data) ? resp.data : []);
}

async function emitNotification(payload, app) {
  const doc = await Notification.create(payload);
  app.get('notifyBroadcast')?.(doc); // push to SSE if configured
}

// Decide trial state
function computeTrialStatus(site) {
  // Adapt these field names to upstream payload
  const trialStart = site.trialStart ? new Date(site.trialStart) : null;
  const trialDays = site.trialDays ?? 14;
  if (!trialStart) return null;
  const end = new Date(trialStart);
  end.setDate(end.getDate() + trialDays);
  const daysLeft = differenceInDays(end, new Date());
  if (daysLeft <= 0) return { type: 'trial_ended', severity: 'error', daysLeft };
  if (daysLeft <= 3) return { type: 'trial_ending', severity: 'warning', daysLeft };
  return null;
}

function startSiteNotificationJob(app) {
  // Every 10 minutes; adjust as needed
  cron.schedule('*/10 * * * *', async () => {
    try {
      const sites = await fetchUpstreamSites();
      for (const s of sites) {
        // 1) Detect new sites
        const existing = await SeenSite.findOne({ siteId: s._id });
        if (!existing) {
          await SeenSite.create({ siteId: s._id, snapshot: s });
          await emitNotification({
            eventType: 'site_created',
            siteId: s._id,
            siteName: s.name || s.siteName || 'New site',
            severity: 'success',
            title: 'Site created',
            message: `${s.name || s.siteName || s._id} was added.`,
          }, app);
        }

        // 2) Detect trial state
        const trial = computeTrialStatus(s);
        if (trial?.type === 'trial_ended') {
          await emitNotification({
            eventType: 'trial_ended',
            siteId: s._id,
            siteName: s.name || s.siteName,
            severity: 'error',
            title: 'Trial ended',
            message: `${s.name || s.siteName} trial has ended.`,
            meta: { daysLeft: trial.daysLeft },
          }, app);
        } else if (trial?.type === 'trial_ending') {
          await emitNotification({
            eventType: 'trial_ending',
            siteId: s._id,
            siteName: s.name || s.siteName,
            severity: 'warning',
            title: 'Trial ending soon',
            message: `${s.name || s.siteName} trial ends in ${trial.daysLeft} day(s).`,
            meta: { daysLeft: trial.daysLeft },
          }, app);
        }
      }
    } catch (err) {
      console.error('Notification job failed:', err.message);
    }
  });
}

module.exports = { startSiteNotificationJob };
