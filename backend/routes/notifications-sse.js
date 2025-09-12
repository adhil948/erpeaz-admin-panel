// routes/notifications-sse.js
const express = require('express');
const router = express.Router();

const clients = new Set();

router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write(`event: ping\ndata: "connected"\n\n`);
  const client = { res };
  clients.add(client);

  req.on('close', () => {
    clients.delete(client);
  });
});

// Hook broadcast into app so controllers/jobs can use it
function attachBroadcast(app) {
  const broadcast = (notificationDoc) => {
    const payload = JSON.stringify(notificationDoc);
    for (const c of clients) {
      c.res.write(`event: notification\ndata: ${payload}\n\n`);
    }
  };
  app.set('notifyBroadcast', broadcast);
}

module.exports = { router, attachBroadcast };
