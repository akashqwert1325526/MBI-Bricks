const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Get all products (public)
router.get('/', (req, res) => {
  const { category, search, available, sort } = req.query;
  let query = `
    SELECT p.*, c.name as category_name, c.name_kn as category_name_kn, c.slug as category_slug,
    inv.current_stock as inventory_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory inv ON inv.product_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (available === 'true') { query += ` AND p.is_available=1`; }
  if (category) { query += ` AND c.slug=?`; params.push(category); }
  if (search) {
    query += ` AND (p.name LIKE ? OR p.name_kn LIKE ? OR c.name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (sort === 'price_asc') query += ' ORDER BY p.price ASC';
  else if (sort === 'price_desc') query += ' ORDER BY p.price DESC';
  else if (sort === 'newest') query += ' ORDER BY p.created_at DESC';
  else query += ' ORDER BY p.is_featured DESC, p.id ASC';

  const products = db.prepare(query).all(...params);
  res.json(products);
});

// Get single product (public)
router.get('/:id', (req, res) => {
  const product = db.prepare(`
    SELECT p.*, c.name as category_name, c.name_kn as category_name_kn, c.slug as category_slug,
    inv.current_stock as inventory_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory inv ON inv.product_id = p.id
    WHERE p.id=?
  `).get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

// Admin: Create product
router.post('/', authenticate, requireAdmin, upload.single('image'), (req, res) => {
  const { name, name_kn, category_id, description, description_kn, price, cost_price, unit, stock, min_stock, min_order_qty, is_available, is_featured } = req.body;
  const image = req.file ? `/uploads/products/${req.file.filename}` : null;
  const result = db.prepare(`
    INSERT INTO products (name, name_kn, category_id, description, description_kn, price, cost_price, unit, stock, min_stock, min_order_qty, is_available, is_featured, image)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(name, name_kn, category_id, description, description_kn, parseFloat(price), parseFloat(cost_price)||0, unit||'piece', parseInt(stock)||0, parseInt(min_stock)||1000, parseInt(min_order_qty)||100, parseInt(is_available)||1, parseInt(is_featured)||0, image);
  
  // Create inventory record
  db.prepare(`INSERT INTO inventory (product_id, current_stock, min_stock) VALUES (?,?,?)`).run(result.lastInsertRowid, parseInt(stock)||0, parseInt(min_stock)||1000);
  
  // Inventory transaction
  db.prepare(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, notes) VALUES (?,?,?,?,?,?)`)
    .run(result.lastInsertRowid, 'added', parseInt(stock)||0, 0, parseInt(stock)||0, 'Initial stock');

  res.json({ id: result.lastInsertRowid, message: 'Product created' });
});

// Admin: Update product
router.put('/:id', authenticate, requireAdmin, upload.single('image'), (req, res) => {
  const { name, name_kn, category_id, description, description_kn, price, cost_price, unit, stock, min_stock, min_order_qty, is_available, is_featured } = req.body;
  const existing = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Product not found' });
  
  const image = req.file ? `/uploads/products/${req.file.filename}` : existing.image;
  db.prepare(`
    UPDATE products SET name=?, name_kn=?, category_id=?, description=?, description_kn=?, price=?, cost_price=?, unit=?, stock=?, min_stock=?, min_order_qty=?, is_available=?, is_featured=?, image=?, updated_at=datetime('now')
    WHERE id=?
  `).run(name, name_kn, category_id, description, description_kn, parseFloat(price), parseFloat(cost_price)||0, unit, parseInt(stock), parseInt(min_stock), parseInt(min_order_qty), parseInt(is_available), parseInt(is_featured), image, req.params.id);

  // Update inventory
  const prevStock = existing.stock;
  const newStock = parseInt(stock);
  if (prevStock !== newStock) {
    db.prepare(`UPDATE inventory SET current_stock=?, min_stock=?, updated_at=datetime('now') WHERE product_id=?`).run(newStock, parseInt(min_stock), req.params.id);
    db.prepare(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, notes) VALUES (?,?,?,?,?,?)`)
      .run(req.params.id, 'adjustment', newStock - prevStock, prevStock, newStock, 'Manual adjustment');
  } else {
    db.prepare(`UPDATE inventory SET min_stock=? WHERE product_id=?`).run(parseInt(min_stock), req.params.id);
  }

  res.json({ message: 'Product updated' });
});

// Admin: Delete product
router.delete('/:id', authenticate, requireAdmin, (req, res) => {
  db.prepare('DELETE FROM products WHERE id=?').run(req.params.id);
  res.json({ message: 'Product deleted' });
});

// Get categories (public)
router.get('/categories/all', (req, res) => {
  const cats = db.prepare('SELECT * FROM categories ORDER BY id').all();
  res.json(cats);
});

module.exports = router;
