// routes/sites.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const expensesRouter = require('./expenses'); // NEW: child router for expenses

// Load config (base URL, token) from env or config file
const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL || 'http://api.erpeaz.org/api';
const EXTERNAL_API_SITES_ENDPOINT = '/site-details';

// List all sites (proxy)
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(`${EXTERNAL_API_BASE_URL}${EXTERNAL_API_SITES_ENDPOINT}`);
    const sites = response.data;
    res.json(sites);
  } catch (error) {
    console.error('Error fetching sites from external API:', error.message);
    res.status(500).json({ error: 'Failed to fetch site data' });
  }
});

// Get a single site by id (filter locally if upstream has no :id)
router.get('/:id', async (req, res) => {
  try {
    const resp = await axios.get(`${EXTERNAL_API_BASE_URL}/site-details`);
    const list = Array.isArray(resp.data?.data) ? resp.data.data : [];
    const site = list.find((s) => s._id === req.params.id);
    if (!site) return res.status(404).json({ error: 'Not found' });
    res.json(site);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch site' });
  }
});

// Mount per-site expenses under /api/sites/:siteId/expenses
router.use('/:siteId/expenses', expensesRouter); // IMPORTANT: nested mount

module.exports = router;
