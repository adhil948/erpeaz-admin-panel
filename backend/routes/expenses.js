// routes/expenses.js (child router)
const express = require('express');
const Expense = require('../models/expense');
const router = express.Router({ mergeParams: true }); // inherit :siteId

// GET /api/sites/:siteId/expenses
router.get('/', async (req, res) => {
  try {
    const items = await Expense.find({ siteId: req.params.siteId }).sort({ date: -1, createdAt: -1 });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/sites/:siteId/expenses
router.post('/', async (req, res) => {
  try {
    const { amount, kind, note, date } = req.body;
    if (amount == null || Number.isNaN(Number(amount))) return res.status(400).json({ error: 'amount is required' });
    if (!['recieved', 'planned', 'due'].includes(kind)) return res.status(400).json({ error: 'invalid kind' });
    const doc = await Expense.create({
      siteId: req.params.siteId,
      amount: Number(amount),
      kind,
      note: note || '',
      date: date ? new Date(date) : new Date(),
    });
    res.status(201).json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/sites/:siteId/expenses/:expenseId
router.put('/:expenseId', async (req, res) => {
  try {
    const { amount, kind, note, date } = req.body;
    const update = {};
    if (amount != null) update.amount = Number(amount);
    if (kind) update.kind = kind;
    if (note != null) update.note = note;
    if (date) update.date = new Date(date);
    const doc = await Expense.findByIdAndUpdate(req.params.expenseId, update, { new: true });
    if (!doc) return res.status(404).json({ error: 'Not found' });
    res.json(doc);
  } catch {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/sites/:siteId/expenses/:expenseId
router.delete('/:expenseId', async (req, res) => {
  try {
    const out = await Expense.findByIdAndDelete(req.params.expenseId);
    if (!out) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// GET /api/sites/:siteId/expenses/summary
router.get('/summary', async (req, res) => {
  try {
    const rows = await Expense.aggregate([
      { $match: { siteId: req.params.siteId } },
      { $group: { _id: '$kind', total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const summary = { recieved: { total: 0, count: 0 }, planned: { total: 0, count: 0 }, due: { total: 0, count: 0 } };
    rows.forEach(r => { summary[r._id] = { total: r.total, count: r.count }; });
    res.json(summary);
  } catch {
    res.status(500).json({ error: 'Failed to summarize expenses' });
  }
});

module.exports = router;
