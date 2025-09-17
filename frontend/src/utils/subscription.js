// src/utils/subscription.js
// Centralized subscription/trial/expiry calculations

// constants
const TRIAL_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// safe date conversion
export const toDateSafe = (v) => {
  const d = v ? new Date(v) : null;
  return d && !isNaN(d.getTime()) ? d : null;
};

// add days
export const addDays = (date, days) => {
  if (!date || isNaN(date.getTime())) return null;
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
};

// add months
export const addMonths = (date, months) => {
  if (!date || isNaN(date.getTime())) return null;
  const d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
};

// difference in days
export const daysDiff = (to, from) => {
  if (!to || !from) return null;
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY);
};

// plan months (basic = 6, others = 12)
export const planMonths = (planKey) =>
  String(planKey).toLowerCase() === "basic" ? 6 : 12;

// core calculation
export const computeExpiry = ({ createdAt, planKey, subscription }) => {
  const createdAtDate = toDateSafe(createdAt);

  // trial ends (14 days after created_at)
  const fallbackTrialEnds = createdAtDate
    ? addDays(createdAtDate, TRIAL_DAYS)
    : null;

  // fallback expiry if no subscription
  const fallbackExpiry = createdAtDate
    ? addMonths(fallbackTrialEnds ?? createdAtDate, planMonths(planKey))
    : null;

  // prefer subscription record
  const effectiveExpiry = subscription?.expiry_at
    ? toDateSafe(subscription.expiry_at)
    : fallbackExpiry;

  const trialEnds = subscription?.trial_end_at
    ? toDateSafe(subscription.trial_end_at)
    : fallbackTrialEnds;

  // days to expiry
  const daysToExpiry = effectiveExpiry
    ? daysDiff(effectiveExpiry, new Date())
    : null;
  const isExpired = daysToExpiry != null && daysToExpiry < 0;

  return {
    effectiveExpiry,
    trialEnds,
    daysToExpiry,
    isExpired,
  };
};
