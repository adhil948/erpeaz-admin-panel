// jobs/siteNotifications.js
const axios = require('axios');
const cron = require('node-cron');
const Notification = require('../models/notification');
const mongoose = require('mongoose');
const { differenceInDays } = require('date-fns');
const { sendMail } = require("../utils/mailer");

// Keep a lightweight cache of seen site IDs to detect "site created"
const SeenSite = mongoose.model(
  'SeenSite',
  new mongoose.Schema(
    { siteId: { type: String, unique: true }, snapshot: Object },
    { timestamps: true }
  )
);



// control mail
const MAIL_EVENT_TYPES = [
  "site_created",
  "trial_ending",
  "trial_ended",
  "basic_plan_expired",
  "plan_expired",
];

// Admin recipients
// const ADMIN_EMAILS = ["admin@erpeaz.com", "support@erpeaz.com","adhilshahanj@gmail.com"];
const ADMIN_EMAILS = ["adhilshahanj@gmail.com"];

// async function emitNotification(payload, app) {
//   const doc = await Notification.create(payload);
//   app.get("notifyBroadcast")?.(doc);

//   // Check if this type of notification should be emailed
//   if (MAIL_EVENT_TYPES.includes(payload.eventType)) {
//     try {
//       await sendMail({
//         to: ADMIN_EMAILS.join(","),
//         subject: `[ERPEaz] ${payload.title}`,
//         text: payload.message,
//         html: `
//           <h3>${payload.title}</h3>
//           <p><strong>Site:</strong> ${payload.siteName || payload.siteId}</p>
//           <p>${payload.message}</p>
//           ${
//             payload.meta
//               ? `<pre>${JSON.stringify(payload.meta, null, 2)}</pre>`
//               : ""
//           }
//         `,
//       });
//     } catch (err) {
//       console.error("Failed to send admin email:", err.message);
//     }
//   }

//   return doc;
// }


// Upstream fetching
async function fetchUpstreamSites() {
  const EXTERNAL_API_BASE_URL =
    process.env.EXTERNAL_API_BASE_URL || 'http://api.erpeaz.org/api';
  const EXTERNAL_API_SITES_ENDPOINT = '/site-details';
  const resp = await axios.get(
    `${EXTERNAL_API_BASE_URL}${EXTERNAL_API_SITES_ENDPOINT}`
  );
  // Adjust path depending on upstream shape
  return Array.isArray(resp.data?.data)
    ? resp.data.data
    : Array.isArray(resp.data)
    ? resp.data
    : [];
}

// Placeholder for a future API providing expired non-basic plans
// Expected shape: [{ siteId, plan, expiredAt, siteName? }, ...]
// Adjust endpoint and mapping once available.
async function fetchExternallyExpiredPlans() {
  const EXTERNAL_API_BASE_URL =
    process.env.EXTERNAL_API_BASE_URL || 'http://api.erpeaz.org/api';
  const EXTERNAL_API_EXPIRED_PLANS_ENDPOINT =
    process.env.EXTERNAL_API_EXPIRED_PLANS_ENDPOINT || '/plans/expired';

  try {
    const resp = await axios.get(
      `${EXTERNAL_API_BASE_URL}${EXTERNAL_API_EXPIRED_PLANS_ENDPOINT}`
    );
    const raw = Array.isArray(resp.data?.data)
      ? resp.data.data
      : Array.isArray(resp.data)
      ? resp.data
      : [];
    // Normalize
    return raw
      .map((r) => ({
        siteId: r.siteId || r._id || r.site_id || r.id,
        plan: String(r.plan || r.planName || '').toLowerCase(),
        expiredAt: r.expiredAt || r.expiry || r.expiryDate,
        siteName: r.siteName || r.name || null,
      }))
      .filter((x) => x.siteId && x.plan && x.expiredAt);
  } catch (e) {
    // If endpoint not live yet, fail silent
    return [];
  }
}

async function emitNotification(payload, app) {
  const doc = await Notification.create(payload);
  app.get('notifyBroadcast')?.(doc); // push to SSE if configured
}

// Emit only once per unique key (e.g., site+expiry+bucket/plan)
async function emitOnce(app, query, payload) {
  const exists = await Notification.findOne(query).lean();
  if (exists) return null;
  return emitNotification(payload, app);
}

// Decide trial state (unchanged)
function computeTrialStatus(site) {
  // Adapt these field names to upstream payload
  const trialStart = site.trialStart ? new Date(site.trialStart) : null;
  const trialDays = site.trialDays ?? 14;
  if (!trialStart) return null;
  const end = new Date(trialStart);
  end.setDate(end.getDate() + trialDays); // add 14 days by default
  const daysLeft = differenceInDays(end, new Date());
  if (daysLeft <= 0)
    return { type: 'trial_ended', severity: 'error', daysLeft };
  if (daysLeft <= 3)
    return { type: 'trial_ending', severity: 'warning', daysLeft };
  return null;
}

// Helpers for date math
function toDateSafe(v) {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d.getTime()) ? d : null;
}
function addDays(date, days) {
  if (!date || isNaN(date.getTime())) return null;
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days); // +N days
  return d;
}
function addMonths(date, months) {
  if (!date || isNaN(date.getTime())) return null;
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months); // +N months
  return d;
}

// Compute Basic plan expiry: trial end (+14 days) then +6 months
function computeBasicPlanExpiry(site, now = new Date()) {
  const planKey = String(site?.plan || site?.planName || '').toLowerCase();
  if (planKey !== 'basic') return null;

  // Prefer explicit trialStart/trialDays; else fall back to created_at
  const trialStart =
    toDateSafe(site?.trialStart) ||
    toDateSafe(site?.created_at) ||
    toDateSafe(site?.createdAt);
  const trialDays = Number.isFinite(site?.trialDays) ? site.trialDays : 14;
  const trialEnd = trialStart ? addDays(trialStart, trialDays) : null;

  // Fallback explicit plan start if trial data is missing
  const fallbackStart =
    toDateSafe(site?.plan_started_at) ||
    toDateSafe(site?.subscription_start) ||
    toDateSafe(site?.updated_at);

  const startPoint = trialEnd || fallbackStart;
  if (!startPoint) return null;

  const expiry = addMonths(startPoint, 6);
  if (!expiry) return null;

  const daysLeft = differenceInDays(expiry, now);
  return { expiry, daysLeft };
}

function startSiteNotificationJob(app) {
  // Every minute; adjust as needed
  cron.schedule('* * * * *', async () => {
    try {

      async function emitNotification(payload, app) {
  const doc = await Notification.create(payload);
  app.get("notifyBroadcast")?.(doc);

  // Check if this type of notification should be emailed
  if (MAIL_EVENT_TYPES.includes(payload.eventType)) {
    try {
      await sendMail({
        to: ADMIN_EMAILS.join(","),
        subject: `[ERPEaz] ${payload.title}`,
        text: payload.message,
        html: `
          <h3>${payload.title}</h3>
          <p><strong>Site:</strong> ${payload.siteName || payload.siteId}</p>
          <p>${payload.message}</p>
          ${
            payload.meta
              ? `<pre>${JSON.stringify(payload.meta, null, 2)}</pre>`
              : ""
          }
        `,
      });
    } catch (err) {
      console.error("Failed to send admin email:", err.message);
    }
  }

  return doc;
}


      const [sites, externalExpired] = await Promise.all([
        fetchUpstreamSites(),
        fetchExternallyExpiredPlans(), // non-basic (and optionally basic) authoritative expiries
      ]);

      // Index external expiries by site for quick checks
      // Multiple entries per site are allowed; we'll loop them below
      for (const s of sites) {
        // 1) Detect new sites
        const existing = await SeenSite.findOne({ siteId: s._id });
        if (!existing) {
          await SeenSite.create({ siteId: s._id, snapshot: s });
          await emitNotification(
            {
              eventType: 'site_created',
              siteId: s._id,
              siteName: s.name || s.siteName || 'New site',
              severity: 'success',
              title: 'Site created',
              message: `${s.name || s.siteName || s._id} was added.`,
            },
            app
          );
        }

        // 2) Detect trial state
        const trial = computeTrialStatus(s);
        if (trial?.type === 'trial_ended') {
          await emitNotification(
            {
              eventType: 'trial_ended',
              siteId: s._id,
              siteName: s.name || s.siteName,
              severity: 'error',
              title: 'Trial ended',
              message: `${s.name || s.siteName} trial has ended.`,
              meta: { daysLeft: trial.daysLeft },
            },
            app
          );
        } else if (trial?.type === 'trial_ending') {
          await emitNotification(
            {
              eventType: 'trial_ending',
              siteId: s._id,
              siteName: s.name || s.siteName,
              severity: 'warning',
              title: 'Trial ending soon',
              message: `${
                s.name || s.siteName
              } trial ends in ${trial.daysLeft} day(s).`,
              meta: { daysLeft: trial.daysLeft },
            },
            app
          );
        }

        // 3) Basic plan expiry (computed: trialEnd + 6 months)
        const basic = computeBasicPlanExpiry(s, new Date());
        if (basic) {
          const { expiry, daysLeft } = basic;
          const expiryISO = expiry.toISOString();
          const siteName = s.name || s.siteName || 'Site';

          // Buckets to avoid spam; notify at 60d, 30d, 7d, and expired
          let eventType = 'basic_plan_ending';
          let severity = 'info';
          let title = 'Basic plan ends soon';
          let message = `${siteName}: Basic plan ends on ${expiry.toLocaleDateString(
            'en-IN'
          )} — ${daysLeft} day(s) remaining.`;
          let bucket = null;

          if (daysLeft <= 0) {
            eventType = 'basic_plan_expired';
            severity = 'error';
            title = 'Basic plan expired';
            message = `${siteName}: Basic plan expired on ${expiry.toLocaleDateString(
              'en-IN'
            )} (${Math.abs(daysLeft)} day(s) ago).`;
            bucket = 'expired';
          } else if (daysLeft <= 7) {
            severity = 'warning';
            bucket = '7d';
          } else if (daysLeft <= 30) {
            severity = 'warning';
            bucket = '30d';
          } else if (daysLeft <= 60) {
            severity = 'info';
            bucket = '60d';
          }

          if (bucket) {
            await emitOnce(
              app,
              {
                eventType,
                siteId: s._id,
                'meta.expiryDate': expiryISO,
                'meta.bucket': bucket,
              },
              {
                eventType,
                siteId: s._id,
                siteName,
                severity,
                title,
                message,
                createdAt: new Date().toISOString(),
                read: false,
                meta: {
                  bucket, // 60d | 30d | 7d | expired
                  expiryDate: expiryISO,
                  daysLeft,
                  plan: 'basic',
                },
              }
            );
          }
        }
      }

      // 4) Expired notifications for non-basic plans via authoritative upstream API
      // Expected to arrive only when the plan is already expired; emit once per site+plan+expiry
      for (const e of externalExpired) {
        const plan = String(e.plan || '').toLowerCase();
        const siteId = e.siteId;
        const siteName = e.siteName || 'Site';
        const expiredAt = toDateSafe(e.expiredAt);
        if (!expiredAt || !siteId || !plan) continue;

        // If upstream also reports basic here, prefer authoritative expiration (optional)
        const eventType =
          plan === 'basic' ? 'basic_plan_expired' : 'plan_expired';

        const expiryISO = expiredAt.toISOString();
        const daysLeft = differenceInDays(expiredAt, new Date()); // negative or zero if expired

        // Only emit if it's expired or the upstream says so
        if (daysLeft > 0) continue;

        await emitOnce(
          app,
          {
            eventType,
            siteId,
            'meta.expiryDate': expiryISO,
            'meta.plan': plan,
          },
          {
            eventType,
            siteId,
            siteName,
            severity: 'error',
            title:
              plan === 'basic'
                ? 'Basic plan expired'
                : 'Plan expired',
            message: `${
              siteName
            }: ${plan.toUpperCase()} plan expired on ${expiredAt.toLocaleDateString(
              'en-IN'
            )}${daysLeft < 0 ? ` (${Math.abs(daysLeft)} day(s) ago)` : ''}.`,
            createdAt: new Date().toISOString(),
            read: false,
            meta: {
              plan,
              expiryDate: expiryISO,
              daysLeft, // usually <= 0
            },
          }
        );
      }
    } catch (err) {
      console.error('Notification job failed:', err.message);
    }
  });
}

module.exports = { startSiteNotificationJob };
