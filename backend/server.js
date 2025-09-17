const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');  // Import auth routes
const sitesRoutes = require('./routes/sites');
const notificationsRouter = require('./routes/notifications');
const revenueRoutes = require('./routes/revenue')
const { startSiteNotificationJob } = require('./jobs/siteNotifications');
const subscriptionRouter = require('./routes/subscription');
const { startSiteSyncJob } = require("./jobs/syncsites");



// server.js (continued)
const { router: sseRouter, attachBroadcast } = require('./routes/notifications-sse');



require('dotenv').config();

const app = express();

// set once (optional default), then attach the broadcaster which overwrites it
app.set('notifyBroadcast', null);
attachBroadcast(app); // this should be after the default and not overwritten later



connectDB();

app.use(cors({
  origin: 'https://admin.webeaz.in', // your frontend URL
  credentials: true, // if you need cookies
}));
app.use(express.json());

// Use the auth routes under /api/auth path
app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/notifications', sseRouter);
app.use('/api/sites/:siteId/subscription', subscriptionRouter); 
app.use('/api', revenueRoutes);


app.set('notifyBroadcast', null);

// Start background job
startSiteNotificationJob(app);
startSiteSyncJob();

// Optional: test root endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
