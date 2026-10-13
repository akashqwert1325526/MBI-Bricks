const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate } = require('../middleware/auth');

// Get cart
router.get('/', authenticate, (req, res) => {
  let cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (!cart) {
    db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.user.id);
    cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  }
  const items = db.prepare(`
    SELECT ci.*, p.name, p.name_kn, p.price, p.unit, p.image, p.is_available, p.min_order_qty, p.stock, p.stock as available_stock
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.cart_id=?
  `).all(cart.id);
  res.json({ cart_id: cart.id, items });
});

// Add/update cart item
router.post('/items', authenticate, (req, res) => {
  const { product_id, quantity } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id=? AND is_available=1').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not available' });
  if (quantity < product.min_order_qty) return res.status(400).json({ error: `Minimum order is ${product.min_order_qty} pieces` });
  if (quantity > product.stock) return res.status(400).json({ error: 'Not enough stock' });

  let cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (!cart) {
    db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.user.id);
    cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  }

  const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id, product_id);
  if (existing) {
    db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(quantity, existing.id);
  } else {
    db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?)').run(cart.id, product_id, quantity);
  }
  res.json({ message: 'Cart updated' });
});

// Update quantity
router.put('/items/:id', authenticate, (req, res) => {
  const { quantity } = req.body;
  const cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  const item = db.prepare('SELECT ci.*, p.stock, p.min_order_qty FROM cart_items ci JOIN products p ON ci.product_id=p.id WHERE ci.id=? AND ci.cart_id=?').get(req.params.id, cart.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (quantity < item.min_order_qty) return res.status(400).json({ error: `Minimum order is ${item.min_order_qty} pieces` });
  if (quantity > item.stock) return res.status(400).json({ error: 'Not enough stock' });
  db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(quantity, req.params.id);
  res.json({ message: 'Updated' });
});

// Remove item
router.delete('/items/:id', authenticate, (req, res) => {
  const cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (!cart) return res.status(404).json({ error: 'Cart not found' });
  db.prepare('DELETE FROM cart_items WHERE id=? AND cart_id=?').run(req.params.id, cart.id);
  res.json({ message: 'Removed' });
});

// Clear cart
router.delete('/clear', authenticate, (req, res) => {
  const cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (cart) db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);
  res.json({ message: 'Cart cleared' });
});

module.exports = router;
