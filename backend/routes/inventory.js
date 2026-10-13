const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all inventory
router.get('/', authenticate, requireAdmin, (req, res) => {
  const inventory = db.prepare(`
    SELECT p.id, p.name, p.name_kn, p.unit, p.min_order_qty, inv.current_stock, inv.min_stock, inv.updated_at,
    CASE WHEN inv.current_stock <= 0 THEN 'out_of_stock' WHEN inv.current_stock < inv.min_stock THEN 'low_stock' ELSE 'in_stock' END as stock_status
    FROM products p
    JOIN inventory inv ON inv.product_id=p.id
    ORDER BY stock_status ASC, p.name ASC
  `).all();
  res.json(inventory);
});

// Get transactions
router.get('/transactions', authenticate, requireAdmin, (req, res) => {
  const { product_id, type, limit = 50 } = req.query;
  let query = `
    SELECT it.*, p.name as product_name, o.order_number
    FROM inventory_transactions it
    JOIN products p ON it.product_id=p.id
    LEFT JOIN orders o ON it.reference_order_id=o.id
    WHERE 1=1
  `;
  const params = [];
  if (product_id) { query += ' AND it.product_id=?'; params.push(product_id); }
  if (type) { query += ' AND it.transaction_type=?'; params.push(type); }
  query += ` ORDER BY it.created_at DESC LIMIT ${limit}`;
  const transactions = db.prepare(query).all(...params);
  res.json(transactions);
});

// Add stock
router.post('/add', authenticate, requireAdmin, (req, res) => {
  const { product_id, quantity, notes } = req.body;
  const qty = parseInt(quantity);
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const prev = product.stock;
  const newStock = prev + qty;
  db.prepare('UPDATE products SET stock=? WHERE id=?').run(newStock, product_id);
  db.prepare(`UPDATE inventory SET current_stock=?, updated_at=datetime('now') WHERE product_id=?`).run(newStock, product_id);
  db.prepare(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, notes) VALUES (?,?,?,?,?,?)`).run(product_id, 'added', qty, prev, newStock, notes || 'Stock added');
  res.json({ message: 'Stock added', new_stock: newStock });
});

// Mark damaged
router.post('/damage', authenticate, requireAdmin, (req, res) => {
  const { product_id, quantity, notes } = req.body;
  const qty = parseInt(quantity);
  const product = db.prepare('SELECT * FROM products WHERE id=?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const prev = product.stock;
  const newStock = Math.max(0, prev - qty);
  db.prepare('UPDATE products SET stock=? WHERE id=?').run(newStock, product_id);
  db.prepare(`UPDATE inventory SET current_stock=?, updated_at=datetime('now') WHERE product_id=?`).run(newStock, product_id);
  db.prepare(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, notes) VALUES (?,?,?,?,?,?)`).run(product_id, 'damaged', qty, prev, newStock, notes || 'Damaged');
  res.json({ message: 'Damage recorded', new_stock: newStock });
});

module.exports = router;
