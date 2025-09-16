// src${process.env.REACT_APP_API_URL}/subscription.js
export async function fetchSubscription(siteId) {
  const r = await fetch(`${process.env.REACT_APP_API_URL}/sites/${siteId}/subscription`);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('Failed to fetch subscription');
  return r.json();
}

export async function initSubscription(siteId, { plan_key, start_at }) {
  const r = await fetch(`${process.env.REACT_APP_API_URL}/sites/${siteId}/subscription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_key, start_at }),
  });
  if (!r.ok) throw new Error('Failed to initialize subscription');
  return r.json();
}

export async function renewSubscription(siteId, { months, actor } = {}) {
  const r = await fetch(`${process.env.REACT_APP_API_URL}/sites/${siteId}/subscription`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'renew', months, actor }),
  });
  if (!r.ok) throw new Error('Failed to renew subscription');
  return r.json();
}
