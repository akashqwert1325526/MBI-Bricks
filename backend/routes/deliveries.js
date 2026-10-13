const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin: Get all deliveries
router.get('/', authenticate, requireAdmin, (req, res) => {
  const deliveries = db.prepare(`
    SELECT d.*, o.order_number, o.order_status, o.delivery_city, o.delivery_state,
    o.delivery_house, o.delivery_street, o.delivery_area, o.delivery_pincode,
    u.full_name as customer_name, u.phone as customer_phone
    FROM deliveries d
    JOIN orders o ON d.order_id=o.id
    JOIN users u ON o.user_id=u.id
    ORDER BY d.created_at DESC
  `).all();
  res.json(deliveries);
});

// Admin: Create/Update delivery
router.post('/', authenticate, requireAdmin, (req, res) => {
  const { order_id, driver_name, vehicle, expected_date, notes } = req.body;
  const existing = db.prepare('SELECT * FROM deliveries WHERE order_id=?').get(order_id);
  if (existing) {
    db.prepare(`UPDATE deliveries SET driver_name=?, vehicle=?, expected_date=?, notes=?, status='assigned', updated_at=datetime('now') WHERE order_id=?`).run(driver_name, vehicle, expected_date, notes, order_id);
  } else {
    db.prepare(`INSERT INTO deliveries (order_id, driver_name, vehicle, expected_date, notes, status) VALUES (?,?,?,?,?,'assigned')`).run(order_id, driver_name, vehicle, expected_date, notes);
  }
  db.prepare(`UPDATE orders SET order_status='dispatched' WHERE id=? AND order_status NOT IN ('delivered','cancelled')`).run(order_id);
  res.json({ message: 'Delivery assigned' });
});

// Admin: Update delivery status
router.put('/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  db.prepare(`UPDATE deliveries SET status=?, updated_at=datetime('now') WHERE id=?`).run(status, req.params.id);
  const delivery = db.prepare('SELECT * FROM deliveries WHERE id=?').get(req.params.id);
  if (status === 'delivered') {
    db.prepare(`UPDATE orders SET order_status='delivered', payment_status=CASE WHEN payment_method='cod' THEN 'paid' ELSE payment_status END WHERE id=?`).run(delivery.order_id);
  } else if (status === 'out_for_delivery') {
    db.prepare(`UPDATE orders SET order_status='out_for_delivery' WHERE id=?`).run(delivery.order_id);
  }
  res.json({ message: 'Updated' });
});

module.exports = router;
