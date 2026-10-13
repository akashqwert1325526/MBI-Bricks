const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all invoices (admin)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const invoices = db.prepare(`
    SELECT i.*, o.order_number, o.total, o.payment_status, o.order_status, u.full_name as customer_name
    FROM invoices i
    JOIN orders o ON i.order_id=o.id
    JOIN users u ON o.user_id=u.id
    ORDER BY i.generated_at DESC
  `).all();
  res.json(invoices);
});

// Get invoice details (admin + customer who owns order)
router.get('/:id', authenticate, (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, o.*, u.full_name as customer_name, u.phone as customer_phone, u.email as customer_email
    FROM invoices i
    JOIN orders o ON i.order_id=o.id
    JOIN users u ON o.user_id=u.id
    WHERE i.id=?
  `).get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (req.user.role !== 'admin' && invoice.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(invoice.order_id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id=?').all(invoice.order_id);
  const settings = db.prepare("SELECT key, value FROM business_settings").all();
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json({ ...invoice, items, payments, settings: settingsMap });
});

// Get invoice by order id (admin + customer)
router.get('/order/:orderId', authenticate, (req, res) => {
  const invoice = db.prepare(`
    SELECT i.*, o.*, u.full_name as customer_name, u.phone as customer_phone, u.email as customer_email
    FROM invoices i
    JOIN orders o ON i.order_id=o.id
    JOIN users u ON o.user_id=u.id
    WHERE i.order_id=?
  `).get(req.params.orderId);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (req.user.role !== 'admin' && invoice.user_id !== req.user.id) return res.status(403).json({ error: 'Access denied' });
  
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(invoice.order_id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id=?').all(invoice.order_id);
  const settings = db.prepare("SELECT key, value FROM business_settings").all();
  const settingsMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json({ ...invoice, items, payments, settings: settingsMap });
});

module.exports = router;
