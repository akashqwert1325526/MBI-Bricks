const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all customers
router.get('/', authenticate, requireAdmin, (req, res) => {
  const customers = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, u.is_active, u.created_at,
    c.city, c.state, c.total_spent, c.total_orders,
    (SELECT SUM(o.total - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.order_id=o.id), 0))
     FROM orders o WHERE o.user_id=u.id AND o.payment_status IN ('pending','partially_paid')) as pending_amount
    FROM users u
    JOIN customers c ON c.user_id=u.id
    ORDER BY u.created_at DESC
  `).all();
  res.json(customers);
});

// Customer: Get my addresses  ← MUST be before /:id to avoid route conflict
router.get('/my/addresses', authenticate, (req, res) => {
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id=? ORDER BY is_default DESC').all(req.user.id);
  res.json(addresses);
});

// Customer: Add address
router.post('/my/addresses', authenticate, (req, res) => {
  const { label, house, street, area, city, state, pincode, is_default } = req.body;
  if (is_default) db.prepare('UPDATE addresses SET is_default=0 WHERE user_id=?').run(req.user.id);
  const result = db.prepare(`INSERT INTO addresses (user_id, label, house, street, area, city, state, pincode, is_default) VALUES (?,?,?,?,?,?,?,?,?)`).run(req.user.id, label || 'Home', house, street, area, city, state, pincode, is_default ? 1 : 0);
  res.json({ id: result.lastInsertRowid, message: 'Address added' });
});

// Customer: Update address
router.put('/my/addresses/:id', authenticate, (req, res) => {
  const { label, house, street, area, city, state, pincode, is_default } = req.body;
  const addr = db.prepare('SELECT * FROM addresses WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!addr) return res.status(404).json({ error: 'Address not found' });
  if (is_default) db.prepare('UPDATE addresses SET is_default=0 WHERE user_id=?').run(req.user.id);
  db.prepare(`UPDATE addresses SET label=?, house=?, street=?, area=?, city=?, state=?, pincode=?, is_default=? WHERE id=?`).run(label, house, street, area, city, state, pincode, is_default ? 1 : 0, req.params.id);
  res.json({ message: 'Updated' });
});

// Customer: Delete address
router.delete('/my/addresses/:id', authenticate, (req, res) => {
  db.prepare('DELETE FROM addresses WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ message: 'Deleted' });
});

// Get customer details (admin)  ← MUST be after /my/* routes
router.get('/:id', authenticate, requireAdmin, (req, res) => {
  const user = db.prepare(`SELECT u.*, c.city, c.state, c.pincode, c.total_spent, c.total_orders FROM users u JOIN customers c ON c.user_id=u.id WHERE u.id=?`).get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Customer not found' });
  const orders = db.prepare('SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC').all(req.params.id);
  const payments = db.prepare('SELECT p.*, o.order_number FROM payments p JOIN orders o ON p.order_id=o.id WHERE p.user_id=? ORDER BY p.created_at DESC').all(req.params.id);
  const addresses = db.prepare('SELECT * FROM addresses WHERE user_id=?').all(req.params.id);
  res.json({ ...user, orders, payments, addresses });
});

// Toggle customer active status
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  const { is_active } = req.body;
  db.prepare('UPDATE users SET is_active=? WHERE id=?').run(is_active, req.params.id);
  res.json({ message: 'Status updated' });
});

module.exports = router;
