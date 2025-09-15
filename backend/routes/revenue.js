// routes/revenue.js (attach under /api)
const express = require('express');
const router = express.Router();
const Expense = require('../models/expense');


function getFiscalRange(startYear) {
  const fyStart = new Date(Number(startYear), 3, 1);        // Apr 1
  const fyEndEx = new Date(Number(startYear) + 1, 3, 1);    // next Apr 1 (exclusive)
  return { fyStart, fyEndEx };
}


router.get('/sites/:siteId/revenue/fy-summary', async (req, res) => {
  try {
    const { siteId } = req.params;
    const fyStartYear = Number(req.query.fyStart); // e.g., 2024 for FY 2024-25
    if (!Number.isFinite(fyStartYear)) {
      return res.status(400).json({ error: 'fyStart query param required (e.g., 2024)' });
    }
    const { fyStart, fyEndEx } = getFiscalRange(fyStartYear);

    const match = {
      siteId: String(siteId),
      kind: 'recieved',
      date: { $gte: fyStart, $lt: fyEndEx },
    };

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
      { $project: { _id: 0, year: '$_id.y', month: '$_id.m', total: 1 } },
    ]);

    res.json({
      siteId,
      fyStartYear: fyStartYear,
      range: { start: fyStart.toISOString(), endExclusive: fyEndEx.toISOString() },
      total: totalAgg?.total || 0,
      monthly,
    });
  } catch {
    res.status(500).json({ error: 'Failed to load fiscal revenue summary' });
  }
});

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

// In routes/revenue.js (add below the per-site route)

// GET /api/revenue/fy-overview?fyStart=2024
router.get('/revenue/fy-overview', async (req, res) => {
  try {
    const fyStartYear = Number(req.query.fyStart);
    if (!Number.isFinite(fyStartYear)) {
      return res.status(400).json({ error: 'fyStart query param required (e.g., 2024)' });
    }
    const { fyStart, fyEndEx } = getFiscalRange(fyStartYear);

    const match = { kind: 'recieved', date: { $gte: fyStart, $lt: fyEndEx } };

    // If a dedicated "sites" collection exists with _id equal to Expense.siteId, prefer that.
    // Otherwise, join to "seensites" created by the notifications job, using snapshot.name as siteName.
    const result = await Expense.aggregate([
      { $match: match },
      {
        $facet: {
          bySite: [
            { $group: { _id: '$siteId', total: { $sum: '$amount' } } },
            { $sort: { total: -1 } },

            // OPTION A: join to SeenSite snapshots (collection name likely "seensites")
            { $lookup: {
                from: 'seensites',
                localField: '_id',          // siteId string in Expense
                foreignField: 'siteId',     // siteId string in SeenSite
                as: 'seen'
            }},
            { $addFields: { siteName: { $ifNull: [ { $arrayElemAt: ['$seen.snapshot.name', 0] }, '' ] } } },
            { $project: { _id: 0, siteId: '$_id', siteName: 1, total: 1 } },

            // OPTION B (alternative): if you have "sites" with ObjectId _id, convert and join:
            // { $addFields: { _idObj: { $toObjectId: '$_id' } } },
            // { $lookup: { from: 'sites', localField: '_idObj', foreignField: '_id', as: 'site' } },
            // { $addFields: { siteName: { $ifNull: [ { $arrayElemAt: ['$site.name', 0] }, '' ] } } },
            // { $project: { _id: 0, siteId: '$_id', siteName: 1, total: 1 } },
          ],
          grand: [
            { $group: { _id: null, total: { $sum: '$amount' } } },
          ],
          monthlyAll: [
            { $group: { _id: { y: { $year: '$date' }, m: { $month: '$date' } }, total: { $sum: '$amount' } } },
            { $sort: { '_id.y': 1, '_id.m': 1 } },
            { $project: { _id: 0, year: '$_id.y', month: '$_id.m', total: 1 } },
          ],
        }
      }
    ]);

    const facet = result?.[0] || {};
    const grandTotal = facet.grand?.[0]?.total || 0;

    res.json({
      fyStartYear,
      range: { start: fyStart.toISOString(), endExclusive: fyEndEx.toISOString() },
      grandTotal,
      sites: facet.bySite || [],            // [{ siteId, siteName, total }]
      monthly: facet.monthlyAll || [],      // [{ year, month, total }] across all sites
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load fiscal overview' });
  }
});


module.exports = router;
