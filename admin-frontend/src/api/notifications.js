// src/api/notifications.js
import axios from 'axios';

export async function fetchNotifications({ unread = false, limit = 50 } = {}) {
  const res = await axios.get(`http://localhost:4000/api/notifications`, { params: { unread, limit } });
  return res.data.data;
}

export async function markAllRead() {
  await axios.patch(`http://localhost:4000/api/notifications/mark-all-read`);
}

export function connectNotificationStream(onMessage) {
  const es = new EventSource('http://localhost:4000/api/notifications/stream');
  es.addEventListener('notification', (e) => {
    const data = JSON.parse(e.data);
    onMessage?.(data);
  });
  return () => es.close();
}
