const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Get all settings
router.get('/', authenticate, requireAdmin, (req, res) => {
  const settings = db.prepare('SELECT * FROM business_settings').all();
  const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
  res.json(map);
});

// Update setting
router.put('/:key', authenticate, requireAdmin, (req, res) => {
  const { value } = req.body;
  db.prepare(`INSERT INTO business_settings (key, value, updated_at) VALUES (?,?,datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(req.params.key, value);
  res.json({ message: 'Setting updated' });
});

// Bulk update via PUT (used by AdminSettings)
router.put('/', authenticate, requireAdmin, (req, res) => {
  const body = req.body;
  for (const [key, value] of Object.entries(body)) {
    if (value !== undefined && value !== null) {
      db.prepare(`INSERT INTO business_settings (key, value, updated_at) VALUES (?,?,datetime('now'))
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(key, String(value));
    }
  }
  res.json({ message: 'Settings updated' });
});

// Bulk update (legacy POST)
router.post('/bulk', authenticate, requireAdmin, (req, res) => {
  const { settings } = req.body;
  for (const [key, value] of Object.entries(settings)) {
    db.prepare(`INSERT INTO business_settings (key, value, updated_at) VALUES (?,?,datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`).run(key, value);
  }
  res.json({ message: 'Settings updated' });
});

// Get categories (admin)
router.get('/categories/all', authenticate, requireAdmin, (req, res) => {
  const cats = db.prepare('SELECT * FROM categories').all();
  res.json(cats);
});

// Add category
router.post('/categories', authenticate, requireAdmin, (req, res) => {
  const { name, name_kn, slug, description } = req.body;
  const result = db.prepare('INSERT INTO categories (name, name_kn, slug, description) VALUES (?,?,?,?)').run(name, name_kn, slug, description);
  res.json({ id: result.lastInsertRowid, message: 'Category created' });
});

// Wishlist
router.get('/wishlist', authenticate, (req, res) => {
  const items = db.prepare(`
    SELECT w.*, p.name, p.name_kn, p.price, p.unit, p.image, p.is_available, p.stock
    FROM wishlist w JOIN products p ON w.product_id=p.id WHERE w.user_id=?
  `).all(req.user.id);
  res.json(items);
});

router.post('/wishlist', authenticate, (req, res) => {
  const { product_id } = req.body;
  try {
    db.prepare('INSERT INTO wishlist (user_id, product_id) VALUES (?,?)').run(req.user.id, product_id);
    res.json({ message: 'Added to wishlist' });
  } catch { res.json({ message: 'Already in wishlist' }); }
});

router.delete('/wishlist/:product_id', authenticate, (req, res) => {
  db.prepare('DELETE FROM wishlist WHERE user_id=? AND product_id=?').run(req.user.id, req.params.product_id);
  res.json({ message: 'Removed' });
});

module.exports = router;
