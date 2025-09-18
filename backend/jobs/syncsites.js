// jobs/syncSites.js
const cron = require("node-cron");
const axios = require("axios");
const SiteSubscription = require("../models/siteSubscription");
const { addDays, addMonths, planMonths, TRIAL_DAYS } = require("../utils/time");

const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL;
const EXTERNAL_API_SITES_ENDPOINT = "/site-details";

function startSiteSyncJob() {
  // Run every 5 minutes
  cron.schedule("* * * * * *", async () => {
    try {
      const resp = await axios.get(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_SITES_ENDPOINT}`);
      const sites = Array.isArray(resp.data?.data) ? resp.data.data : [];

      for (const site of sites) {
        const existing = await SiteSubscription.findOne({ siteId: site._id });
        if (!existing) {
          const planKey = site.plan || "Basic";
          const start = new Date(site.created_at || Date.now());
          const trialEnd = addDays(start, TRIAL_DAYS);
          const expiry = addMonths(trialEnd, planMonths(planKey));

          await SiteSubscription.create({
            siteId: site._id,
            plan_key: planKey,
            start_at: start,
            trial_end_at: trialEnd,
            expiry_at: expiry,
            renewal_history: [],
          });

          console.log(`Initialized fsubscription for site ${site._id}`);
          console.log(site.plan)
        }
      }
    } catch (err) {
      console.error("Failed to sync sites:", err.message);
    }
  });
}

module.exports = { startSiteSyncJob };
