const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin: Get all payments
router.get('/', authenticate, requireAdmin, (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, o.order_number, o.total as order_total, o.payment_status, u.full_name as customer_name
    FROM payments p
    JOIN orders o ON p.order_id=o.id
    JOIN users u ON p.user_id=u.id
    ORDER BY p.created_at DESC
  `).all();
  res.json(payments);
});

// Admin: Record payment
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { order_id, amount, method, transaction_ref, notes } = req.body;
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(order_id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  
  db.prepare(`INSERT INTO payments (order_id, user_id, amount, method, transaction_ref, notes) VALUES (?,?,?,?,?,?)`).run(order_id, order.user_id, parseFloat(amount), method, transaction_ref || '', notes || '');

  // Calculate total paid
  const totalPaid = db.prepare('SELECT SUM(amount) as total FROM payments WHERE order_id=?').get(order_id).total || 0;
  let payStatus = totalPaid >= order.total ? 'paid' : totalPaid > 0 ? 'partially_paid' : 'pending';
  db.prepare(`UPDATE orders SET payment_status=? WHERE id=?`).run(payStatus, order_id);
  
  res.json({ message: 'Payment recorded', total_paid: totalPaid, payment_status: payStatus });
});

// Customer: Get my payments
router.get('/my', authenticate, (req, res) => {
  const payments = db.prepare(`
    SELECT p.*, o.order_number, o.total as order_total, o.payment_status
    FROM payments p JOIN orders o ON p.order_id=o.id
    WHERE p.user_id=?
    ORDER BY p.created_at DESC
  `).all(req.user.id);
  res.json(payments);
});

// Admin: Get payment stats
router.get('/stats', authenticate, requireAdmin, (req, res) => {
  const totalReceived = db.prepare("SELECT SUM(amount) as t FROM payments").get().t || 0;
  const pendingAmount = db.prepare("SELECT SUM(total) as t FROM orders WHERE payment_status IN ('pending','partially_paid')").get().t || 0;
  const todayReceived = db.prepare("SELECT SUM(amount) as t FROM payments WHERE date(payment_date)=date('now')").get().t || 0;
  res.json({ total_received: totalReceived, pending_amount: pendingAmount, today_received: todayReceived });
});

module.exports = router;
