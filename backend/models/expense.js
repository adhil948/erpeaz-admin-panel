// models/Expense.js
const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema(
  {
    siteId: { type: String, required: true, index: true }, // external site's _id as string
    amount: { type: Number, required: true, min: 0 },
    kind: { type: String, enum: ['recieved', 'planned', 'due'], required: true },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', ExpenseSchema);
