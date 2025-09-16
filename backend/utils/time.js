// utils/time.js (backend)
const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 14;

function addDays(d, days) {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + days);
  return x;
}
function addMonths(d, months) {
  const x = new Date(d.getTime());
  x.setMonth(x.getMonth() + months); // handles overflow
  return x;
}
function planMonths(planKey) {
  return planKey === 'basic' ? 6 : 12;
}

module.exports = { addDays, addMonths, planMonths, TRIAL_DAYS, MS_PER_DAY };
