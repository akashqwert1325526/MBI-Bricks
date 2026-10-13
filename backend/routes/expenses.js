const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

let expenseCounter = 6;

function getExpenseNumber() {
  const last = db.prepare("SELECT expense_number FROM expenses ORDER BY id DESC LIMIT 1").get();
  if (last) {
    const num = parseInt(last.expense_number.replace('EXP', '')) + 1;
    return `EXP${String(num).padStart(4, '0')}`;
  }
  return `EXP${String(expenseCounter++).padStart(4, '0')}`;
}

// Get all expenses
router.get('/', authenticate, requireAdmin, (req, res) => {
  const { from, to, category } = req.query;
  let query = 'SELECT * FROM expenses WHERE 1=1';
  const params = [];
  if (from) { query += ' AND expense_date >= ?'; params.push(from); }
  if (to) { query += ' AND expense_date <= ?'; params.push(to); }
  if (category) { query += ' AND category=?'; params.push(category); }
  query += ' ORDER BY expense_date DESC, id DESC';
  const expenses = db.prepare(query).all(...params);

  const today = db.prepare("SELECT SUM(amount) as t FROM expenses WHERE expense_date=date('now')").get().t || 0;
  const monthly = db.prepare("SELECT SUM(amount) as t FROM expenses WHERE strftime('%Y-%m', expense_date)=strftime('%Y-%m', 'now')").get().t || 0;
  const total = db.prepare("SELECT SUM(amount) as t FROM expenses").get().t || 0;

  res.json({ expenses, today, monthly, total });
});

// Add expense
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { category, description, amount, payment_method, expense_date } = req.body;
  const num = getExpenseNumber();
  db.prepare(`INSERT INTO expenses (expense_number, category, description, amount, payment_method, expense_date) VALUES (?,?,?,?,?,?)`).run(num, category, description, parseFloat(amount), payment_method || 'cash', expense_date || new Date().toISOString().split('T')[0]);
  res.json({ message: 'Expense added', expense_number: num });
});

// Update expense
router.put('/:id', authenticate, requireAdmin, (req, res) => {
  const { category, description, amount, payment_method, expense_date } = req.body;
  db.prepare(`UPDATE expenses SET category=?, description=?, amount=?, payment_method=?, expense_date=? WHERE id=?`).run(category, description, parseFloat(amount), payment_method, expense_date, req.params.id);
  res.json({ message: 'Updated' });
});

// Delete expense
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id=?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
