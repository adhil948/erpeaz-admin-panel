// routes/sites.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

// Load config (base URL, token) from env or config file
const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://api.erpeaz.org/api';
const EXTERNAL_API_SITES_ENDPOINT = '/site-details';

// Optionally, add auth middleware here to protect this route
router.get('/', async (req, res) => {
  try {
    // Fetch from external company API
    const response = await axios.get(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_SITES_ENDPOINT}`);

    // Assuming response.data contains array of sites
    const sites = response.data;

    // You can filter, sanitize, or reshape the data here if needed before sending to frontend
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites from external API:', error.message);
    res.status(500).json({ error: 'Failed to fetch site data' });
  }
});

module.exports = router;
