const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const authRoutes = require('./routes/auth');  // Import auth routes
const sitesRoutes = require('./routes/sites');

require('dotenv').config();


const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Use the auth routes under /api/auth path
app.use('/api/auth', authRoutes);
app.use('/api/sites', sitesRoutes);

// Optional: test root endpoint
app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
