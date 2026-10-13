const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

function getNextOrderNumber() {
  const setting = db.prepare("SELECT value FROM business_settings WHERE key='next_order_number'").get();
  const prefix = db.prepare("SELECT value FROM business_settings WHERE key='order_prefix'").get();
  const num = parseInt(setting?.value || '1001');
  db.prepare("UPDATE business_settings SET value=? WHERE key='next_order_number'").run(String(num + 1));
  return `${prefix?.value || 'MBI'}${num}`;
}

const { haversineKm, calculateDeliveryCharge } = require('../utils/delivery');


// Create a notification for admin
function notifyAdmin(title, message, type = 'order') {
  try {
    const admin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
    if (admin) {
      db.prepare(`INSERT INTO notifications (user_id, title, message, type) VALUES (?,?,?,?)`)
        .run(admin.id, title, message, type);
    }
  } catch (e) { /* silent fail */ }
}

// Customer: Place order
router.post('/', authenticate, (req, res) => {
  const { address_id, delivery_address, payment_method, notes, delivery_lat, delivery_lng, delivery_location_label, phone } = req.body;

  // Update user's phone if provided during checkout
  if (phone) {
    db.prepare('UPDATE users SET phone=? WHERE id=?').run(phone, req.user.id);
  }

  const cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (!cart) return res.status(400).json({ error: 'Cart is empty' });
  const cartItems = db.prepare(`
    SELECT ci.*, p.name, p.name_kn, p.price, p.unit, p.stock, p.is_available
    FROM cart_items ci JOIN products p ON ci.product_id=p.id WHERE ci.cart_id=?
  `).all(cart.id);
  if (!cartItems.length) return res.status(400).json({ error: 'Cart is empty' });

  // Validate stock
  for (const item of cartItems) {
    if (!item.is_available) return res.status(400).json({ error: `${item.name} is not available` });
    if (item.quantity > item.stock) return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
  }

  // Calculate brick count & delivery charge based on distance and brick capacity
  const totalBricks = cartItems.reduce((s, i) => s + i.quantity, 0);
  let distanceKm = null;

  if (delivery_lat && delivery_lng) {
    const bizLat = parseFloat(db.prepare("SELECT value FROM business_settings WHERE key='business_lat'").get()?.value || '0');
    const bizLng = parseFloat(db.prepare("SELECT value FROM business_settings WHERE key='business_lng'").get()?.value || '0');
    if (bizLat && bizLng) {
      distanceKm = Math.round(haversineKm(bizLat, bizLng, delivery_lat, delivery_lng) * 10) / 10;
    }
  }

  const deliveryCalc = calculateDeliveryCharge(distanceKm, totalBricks);
  const deliveryCharge = deliveryCalc.charge;
  const vehicleType = deliveryCalc.vehicle_type;
  const truckTrips = deliveryCalc.truck_trips;

  const subtotal = cartItems.reduce((s, i) => s + i.quantity * i.price, 0);
  const total = subtotal + deliveryCharge;
  const orderNumber = getNextOrderNumber();

  let addr = {};
  if (address_id) {
    addr = db.prepare('SELECT * FROM addresses WHERE id=? AND user_id=?').get(address_id, req.user.id) || {};
  }
  if ((!addr || !addr.city) && delivery_address) {
    addr = delivery_address;
  }

  const orderResult = db.prepare(`
    INSERT INTO orders (order_number, user_id, address_id, delivery_house, delivery_street, delivery_area, delivery_city, delivery_state, delivery_pincode, delivery_lat, delivery_lng, delivery_location_label, delivery_distance_km, vehicle_type, truck_trips, total_bricks, subtotal, delivery_charge, total, payment_method, payment_status, order_status, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    orderNumber, req.user.id, address_id || null,
    addr.house || addr.delivery_house || '', addr.street || addr.delivery_street || '',
    addr.area || addr.delivery_area || '', addr.city || addr.delivery_city || '',
    addr.state || addr.delivery_state || '', addr.pincode || addr.delivery_pincode || '',
    delivery_lat || null, delivery_lng || null,
    delivery_location_label || null, distanceKm,
    vehicleType, truckTrips, totalBricks,
    subtotal, deliveryCharge, total, payment_method || 'cod', 'pending', 'placed', notes || ''
  );

  const orderId = orderResult.lastInsertRowid;

  // Insert order items & reduce stock
  for (const item of cartItems) {
    db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, product_name_kn, unit, quantity, price, subtotal) VALUES (?,?,?,?,?,?,?,?)`).run(orderId, item.product_id, item.name, item.name_kn, item.unit, item.quantity, item.price, item.quantity * item.price);
    
    const prevStock = db.prepare('SELECT stock FROM products WHERE id=?').get(item.product_id).stock;
    const newStock = prevStock - item.quantity;
    db.prepare('UPDATE products SET stock=stock-? WHERE id=?').run(item.quantity, item.product_id);
    db.prepare(`UPDATE inventory SET current_stock=current_stock-?, updated_at=datetime('now') WHERE product_id=?`).run(item.quantity, item.product_id);
    db.prepare(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, reference_order_id, notes) VALUES (?,?,?,?,?,?,?)`).run(item.product_id, 'sale', item.quantity, prevStock, newStock, orderId, `Order ${orderNumber}`);
  }

  // Handle payment for UPI/Card/Bank
  if (['upi', 'card', 'bank_transfer'].includes(payment_method)) {
    db.prepare(`INSERT INTO payments (order_id, user_id, amount, method) VALUES (?,?,?,?)`).run(orderId, req.user.id, total, payment_method);
    db.prepare(`UPDATE orders SET payment_status='paid' WHERE id=?`).run(orderId);
  }

  // Clear cart
  db.prepare('DELETE FROM cart_items WHERE cart_id=?').run(cart.id);

  // Update customer stats
  db.prepare('UPDATE customers SET total_orders=total_orders+1, total_spent=total_spent+? WHERE user_id=?').run(total, req.user.id);

  // 🔔 Notify admin
  const customer = db.prepare('SELECT full_name, phone FROM users WHERE id=?').get(req.user.id);
  const itemsSummary = cartItems.map(i => `${i.name} x${i.quantity}`).join(', ');
  const distanceText = distanceKm ? ` (${distanceKm} km away)` : '';
  const locationText = delivery_location_label ? `\nLocation: ${delivery_location_label}${distanceText}` : '';
  notifyAdmin(
    `🧱 New Order ${orderNumber}`,
    `Customer: ${customer?.full_name || 'Unknown'} (${customer?.phone || ''})\nItems: ${itemsSummary}\nTotal: ₹${total.toLocaleString('en-IN')}\nDelivery: ₹${deliveryCharge}${locationText}`,
    'new_order'
  );

  res.json({ order_number: orderNumber, order_id: orderId, total, delivery_charge: deliveryCharge, distance_km: distanceKm });
});

// Customer: Get my orders
router.get('/my', authenticate, (req, res) => {
  const orders = db.prepare(`
    SELECT o.*, 
    GROUP_CONCAT(oi.product_name || ' x' || oi.quantity) as items_summary
    FROM orders o
    LEFT JOIN order_items oi ON oi.order_id=o.id
    WHERE o.user_id=?
    GROUP BY o.id ORDER BY o.created_at DESC
  `).all(req.user.id);
  res.json(orders);
});

// Customer: Get single order
router.get('/my/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id=?').all(order.id);
  const delivery = db.prepare('SELECT * FROM deliveries WHERE order_id=?').get(order.id);
  const invoice = db.prepare('SELECT * FROM invoices WHERE order_id=?').get(order.id);
  res.json({ ...order, items, payments, delivery, invoice });
});

// Admin: Get all orders
router.get('/admin/all', authenticate, requireAdmin, (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  let query = `
    SELECT o.*, u.full_name as customer_name, u.phone as customer_phone,
    GROUP_CONCAT(oi.product_name || ' x' || oi.quantity) as items_summary
    FROM orders o
    JOIN users u ON o.user_id=u.id
    LEFT JOIN order_items oi ON oi.order_id=o.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND o.order_status=?'; params.push(status); }
  if (search) { query += ' AND (o.order_number LIKE ? OR u.full_name LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  query += ' GROUP BY o.id ORDER BY o.created_at DESC';
  const offset = (parseInt(page) - 1) * parseInt(limit);
  query += ` LIMIT ${limit} OFFSET ${offset}`;
  const orders = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM orders').get().count;
  res.json({ orders, total, page: parseInt(page) });
});

// Admin: Get single order
router.get('/admin/:id', authenticate, requireAdmin, (req, res) => {
  const order = db.prepare(`
    SELECT o.*, u.full_name as customer_name, u.phone as customer_phone, u.email as customer_email
    FROM orders o JOIN users u ON o.user_id=u.id WHERE o.id=?
  `).get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
  const payments = db.prepare('SELECT * FROM payments WHERE order_id=?').all(order.id);
  const delivery = db.prepare('SELECT * FROM deliveries WHERE order_id=?').get(order.id);
  const invoice = db.prepare('SELECT * FROM invoices WHERE order_id=?').get(order.id);
  res.json({ ...order, items, payments, delivery, invoice });
});

// Admin: Update order status
router.put('/admin/:id/status', authenticate, requireAdmin, (req, res) => {
  const { order_status } = req.body;
  const validStatuses = ['placed','confirmed','preparing','dispatched','out_for_delivery','delivered','cancelled'];
  if (!validStatuses.includes(order_status)) return res.status(400).json({ error: 'Invalid status' });
  
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  // If cancelling, restore stock
  if (order_status === 'cancelled' && order.order_status !== 'cancelled') {
    const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);
    for (const item of items) {
      if (item.product_id) {
        const prevStock = db.prepare('SELECT stock FROM products WHERE id=?').get(item.product_id)?.stock || 0;
        db.prepare('UPDATE products SET stock=stock+? WHERE id=?').run(item.quantity, item.product_id);
        db.prepare('UPDATE inventory SET current_stock=current_stock+? WHERE product_id=?').run(item.quantity, item.product_id);
        db.prepare(`INSERT INTO inventory_transactions (product_id, transaction_type, quantity, previous_stock, new_stock, reference_order_id, notes) VALUES (?,?,?,?,?,?,?)`)
          .run(item.product_id, 'returned', item.quantity, prevStock, prevStock + item.quantity, order.id, `Cancelled order ${order.order_number}`);
      }
    }
  }

  db.prepare(`UPDATE orders SET order_status=?, updated_at=datetime('now') WHERE id=?`).run(order_status, req.params.id);
  
  // Update delivery status accordingly
  if (order_status === 'dispatched') {
    const deliv = db.prepare('SELECT * FROM deliveries WHERE order_id=?').get(req.params.id);
    if (deliv) db.prepare(`UPDATE deliveries SET status='assigned' WHERE order_id=?`).run(req.params.id);
  }
  if (order_status === 'out_for_delivery') {
    db.prepare(`UPDATE deliveries SET status='out_for_delivery' WHERE order_id=?`).run(req.params.id);
  }
  if (order_status === 'delivered') {
    db.prepare(`UPDATE deliveries SET status='delivered', actual_date=date('now') WHERE order_id=?`).run(req.params.id);
    db.prepare(`UPDATE orders SET payment_status=CASE WHEN payment_method='cod' THEN 'paid' ELSE payment_status END WHERE id=?`).run(req.params.id);
  }

  res.json({ message: 'Status updated' });
});

// Admin: Generate invoice
router.post('/admin/:id/invoice', authenticate, requireAdmin, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const existing = db.prepare('SELECT * FROM invoices WHERE order_id=?').get(req.params.id);
  if (existing) return res.json(existing);
  const invoiceNumber = `INV-${order.order_number}`;
  const result = db.prepare(`INSERT INTO invoices (invoice_number, order_id, notes) VALUES (?,?,?)`).run(invoiceNumber, req.params.id, req.body.notes || '');
  res.json({ id: result.lastInsertRowid, invoice_number: invoiceNumber, order_id: req.params.id });
});

// Customer: Reorder
router.post('/reorder/:id', authenticate, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const items = db.prepare('SELECT * FROM order_items WHERE order_id=?').all(order.id);

  let cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  if (!cart) {
    db.prepare('INSERT INTO cart (user_id) VALUES (?)').run(req.user.id);
    cart = db.prepare('SELECT * FROM cart WHERE user_id=?').get(req.user.id);
  }

  const errors = [];
  for (const item of items) {
    if (!item.product_id) { errors.push(`${item.product_name} no longer available`); continue; }
    const product = db.prepare('SELECT * FROM products WHERE id=? AND is_available=1').get(item.product_id);
    if (!product) { errors.push(`${item.product_name} no longer available`); continue; }
    if (item.quantity > product.stock) { errors.push(`Insufficient stock for ${item.product_name}`); continue; }
    const existing = db.prepare('SELECT * FROM cart_items WHERE cart_id=? AND product_id=?').get(cart.id, item.product_id);
    if (existing) {
      db.prepare('UPDATE cart_items SET quantity=? WHERE id=?').run(item.quantity, existing.id);
    } else {
      db.prepare('INSERT INTO cart_items (cart_id, product_id, quantity) VALUES (?,?,?)').run(cart.id, item.product_id, item.quantity);
    }
  }
  res.json({ message: 'Added to cart', errors });
});

module.exports = router;
