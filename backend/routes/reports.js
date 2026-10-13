const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/dashboard', authenticate, requireAdmin, (req, res) => {
  const totalSales = db.prepare("SELECT SUM(total) as t FROM orders WHERE order_status NOT IN ('cancelled')").get().t || 0;
  const todaySales = db.prepare("SELECT SUM(total) as t FROM orders WHERE date(created_at)=date('now') AND order_status NOT IN ('cancelled')").get().t || 0;
  const totalOrders = db.prepare("SELECT COUNT(*) as c FROM orders").get().c || 0;
  const pendingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE order_status IN ('placed','confirmed','preparing')").get().c || 0;
  const totalCustomers = db.prepare("SELECT COUNT(*) as c FROM customers").get().c || 0;
  const totalReceived = db.prepare("SELECT SUM(amount) as t FROM payments").get().t || 0;
  const pendingPayments = db.prepare("SELECT SUM(total) as t FROM orders WHERE payment_status IN ('pending','partially_paid') AND order_status NOT IN ('cancelled')").get().t || 0;
  const pendingDeliveries = db.prepare("SELECT COUNT(*) as c FROM deliveries WHERE status NOT IN ('delivered')").get().c || 0;
  const todayExpenses = db.prepare("SELECT SUM(amount) as t FROM expenses WHERE expense_date=date('now')").get().t || 0;
  const totalExpenses = db.prepare("SELECT SUM(amount) as t FROM expenses").get().t || 0;
  const lowStock = db.prepare("SELECT COUNT(*) as c FROM inventory WHERE current_stock < min_stock").get().c || 0;

  res.json({
    total_sales: totalSales, today_sales: todaySales, total_orders: totalOrders,
    pending_orders: pendingOrders, total_customers: totalCustomers, total_received: totalReceived,
    pending_payments: pendingPayments, pending_deliveries: pendingDeliveries,
    today_expenses: todayExpenses, total_expenses: totalExpenses, low_stock_count: lowStock
  });
});

router.get('/monthly-sales', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, SUM(total) as sales, COUNT(*) as orders
    FROM orders WHERE order_status NOT IN ('cancelled')
    GROUP BY month ORDER BY month DESC LIMIT 12
  `).all().reverse();
  res.json(data);
});

router.get('/product-sales', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT oi.product_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id=o.id
    WHERE o.order_status NOT IN ('cancelled')
    GROUP BY oi.product_id, oi.product_name
    ORDER BY total_revenue DESC
  `).all();
  res.json(data);
});

router.get('/expense-by-category', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`SELECT category, SUM(amount) as total FROM expenses GROUP BY category ORDER BY total DESC`).all();
  res.json(data);
});

router.get('/payment-status', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT payment_status, COUNT(*) as count, SUM(total) as amount
    FROM orders WHERE order_status NOT IN ('cancelled')
    GROUP BY payment_status
  `).all();
  res.json(data);
});

router.get('/order-status', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`SELECT order_status, COUNT(*) as count FROM orders GROUP BY order_status`).all();
  res.json(data);
});

router.get('/inventory-movement', authenticate, requireAdmin, (req, res) => {
  const { product_id } = req.query;
  let query = `
    SELECT it.*, p.name as product_name, strftime('%Y-%m-%d', it.created_at) as date
    FROM inventory_transactions it JOIN products p ON it.product_id=p.id WHERE 1=1
  `;
  const params = [];
  if (product_id) { query += ' AND it.product_id=?'; params.push(product_id); }
  query += ' ORDER BY it.created_at DESC LIMIT 100';
  res.json(db.prepare(query).all(...params));
});

router.get('/customer-sales', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT u.full_name, u.email, COUNT(o.id) as order_count, SUM(o.total) as total_spent
    FROM orders o JOIN users u ON o.user_id=u.id
    WHERE o.order_status NOT IN ('cancelled')
    GROUP BY o.user_id ORDER BY total_spent DESC LIMIT 10
  `).all();
  res.json(data);
});

router.get('/daily-sales', authenticate, requireAdmin, (req, res) => {
  const { days = 30 } = req.query;
  const data = db.prepare(`
    SELECT date(created_at) as date, SUM(total) as sales, COUNT(*) as orders
    FROM orders WHERE order_status NOT IN ('cancelled') AND date(created_at) >= date('now', '-${parseInt(days)} days')
    GROUP BY date(created_at) ORDER BY date ASC
  `).all();
  res.json(data);
});

router.get('/category-sales', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT c.name as category_name, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_revenue, COUNT(DISTINCT o.id) as order_count
    FROM order_items oi
    JOIN orders o ON oi.order_id=o.id
    JOIN products p ON oi.product_id=p.id
    JOIN categories c ON p.category_id=c.id
    WHERE o.order_status NOT IN ('cancelled')
    GROUP BY p.category_id, c.name ORDER BY total_revenue DESC
  `).all();
  res.json(data);
});

router.get('/monthly-expenses', authenticate, requireAdmin, (req, res) => {
  const months = parseInt(req.query.months) || 12;
  const data = db.prepare(`
    SELECT strftime('%Y-%m', expense_date) as month, SUM(amount) as total, COUNT(*) as count
    FROM expenses GROUP BY month ORDER BY month DESC LIMIT ?
  `).all(months).reverse();
  res.json(data);
});

router.get('/top-customers', authenticate, requireAdmin, (req, res) => {
  const data = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, COUNT(o.id) as total_orders, SUM(o.total) as total_spent
    FROM orders o JOIN users u ON o.user_id=u.id
    WHERE o.order_status NOT IN ('cancelled')
    GROUP BY o.user_id ORDER BY total_spent DESC LIMIT 10
  `).all();
  res.json(data);
});

module.exports = router;
