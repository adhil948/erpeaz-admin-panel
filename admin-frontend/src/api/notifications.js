// src/api/notifications.js
import axios from 'axios';

export async function fetchNotifications({ unread = false, limit = 50 } = {}) {
  const res = await axios.get(`${process.env.REACT_APP_API_URL}/notifications`, { params: { unread, limit } });
  return res.data.data;
}

export async function markAllRead() {
  await axios.patch(`${process.env.REACT_APP_API_URL}/notifications/mark-all-read`);
}

export function connectNotificationStream(onMessage) {
  const es = new EventSource(`${process.env.REACT_APP_API_URL}/notifications/stream`);
  es.addEventListener('notification', (e) => {
    const data = JSON.parse(e.data);
    onMessage?.(data);
  });
  return () => es.close();
}
