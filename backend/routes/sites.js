// routes/sites.js
require('dotenv').config();
const express = require('express');
const router = express.Router();
const axios = require('axios');
const expensesRouter = require('./expenses'); // NEW: child router for expenses

// Load config (base URL, token) from env or config file
const EXTERNAL_API_BASE_URL = process.env.EXTERNAL_API_BASE_URL ;
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


// POST /api/sites/:id/send-email
router.post("/:id/send-email", async (req, res) => {
  const { id } = req.params;
  try {
    // Later you'll replace this with the real API call:
    // await axios.post("http://other-node-service/send-email", { company_id: id });
    await axios.post(`${EXTERNAL_API_BASE_URL}/usermail/${id}`)

    console.log(`Simulating email send for site ID: ${id}`);
    res.json({ message: `Email triggered for site ${id}` });
  } catch (err) {
    console.error("Send email error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});


// Mount per-site expenses under /api/sites/:siteId/expenses
router.use('/:siteId/expenses', expensesRouter); // IMPORTANT: nested mount

module.exports = router;
