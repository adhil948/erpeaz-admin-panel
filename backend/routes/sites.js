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

router.get('/:id', async (req, res) => {
  try {
    // If upstream supports /site-details/:id, prefer that:
    // const resp = await axios.get(`${EXTERNAL_API_BASE_URL}/site-details/${req.params.id}`);
    // return res.json(resp.data);

    // Otherwise, fetch all and filter locally:
    const resp = await axios.get(`${EXTERNAL_API_BASE_URL}/site-details`);
    const list = Array.isArray(resp.data?.data) ? resp.data.data : [];
    const site = list.find(s => s._id === req.params.id);
    if (!site) return res.status(404).json({ error: 'Not found' });
    res.json(site);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch site' });
  }
});

module.exports = router;
