// routes/revenue.js (attach under /api)
const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');

// GET /api/sites/:siteId/revenue/summary?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/sites/:siteId/revenue/summary', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { from, to } = req.query;

    const match = { siteId: String(siteId), kind: 'recieved' }; // revenue = received payments only
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }

    const [totalAgg] = await Expense.aggregate([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    const monthly = await Expense.aggregate([
      { $match: match },
      {
        $group: {
          _id: { y: { $year: '$date' }, m: { $month: '$date' } },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.y': 1, '_id.m': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.y',
          month: '$_id.m',
          total: 1,
        },
      },
    ]);

    // quick 30-day window
    const since30 = new Date();
    since30.setDate(since30.getDate() - 30);
    const [last30Agg] = await Expense.aggregate([
      { $match: { ...match, date: { ...(match.date || {}), $gte: since30 } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      siteId,
      total: totalAgg?.total || 0,
      last30Days: last30Agg?.total || 0,
      monthly, // [{year, month, total}]
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load revenue summary' });
  }
});

// GET /api/sites/:siteId/revenue/transactions?limit=50&skip=0&from&to
router.get('/sites/:siteId/revenue/transactions', async (req, res) => {
  try {
    const { siteId } = req.params;
    const { limit = 50, skip = 0, from, to } = req.query;

    const filter = { siteId: String(siteId), kind: 'recieved' };
    if (from || to) {
      filter.date = {};
      if (from) filter.date.$gte = new Date(from);
      if (to) filter.date.$lte = new Date(to);
    }

    const items = await Expense.find(filter)
      .sort({ date: -1 })
      .skip(Number(skip))
      .limit(Number(limit))
      .lean();

    const [totalAgg] = await Expense.aggregate([
      { $match: filter },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      siteId,
      total: totalAgg?.total || 0,
      count: items.length,
      items,
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load revenue transactions' });
  }
});

module.exports = router;
