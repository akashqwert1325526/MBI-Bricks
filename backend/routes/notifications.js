const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Admin: Get all notifications (unread first)
router.get('/', authenticate, requireAdmin, (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id=? ORDER BY is_read ASC, created_at DESC LIMIT 50
  `).all(req.user.id);
  const unreadCount = db.prepare(`SELECT COUNT(*) as count FROM notifications WHERE user_id=? AND is_read=0`).get(req.user.id)?.count || 0;
  res.json({ notifications, unreadCount });
});

// Admin: Mark notification(s) as read
router.put('/read-all', authenticate, requireAdmin, (req, res) => {
  db.prepare(`UPDATE notifications SET is_read=1 WHERE user_id=?`).run(req.user.id);
  res.json({ message: 'All marked read' });
});

router.put('/:id/read', authenticate, requireAdmin, (req, res) => {
  db.prepare(`UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?`).run(req.params.id, req.user.id);
  res.json({ message: 'Marked read' });
});

const { calculateDeliveryCharge, haversineKm } = require('../utils/delivery');

// Public: Calculate delivery charge preview (for checkout)
router.post('/delivery-charge', authenticate, (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  let totalBricks = parseInt(req.body.total_bricks || req.body.quantity || 0);
  if (!totalBricks && req.user?.id) {
    const cart = db.prepare('SELECT id FROM cart WHERE user_id=?').get(req.user.id);
    if (cart) {
      totalBricks = db.prepare('SELECT SUM(quantity) as qty FROM cart_items WHERE cart_id=?').get(cart.id)?.qty || 0;
    }
  }

  const bizLat = parseFloat(db.prepare("SELECT value FROM business_settings WHERE key='business_lat'").get()?.value || '0');
  const bizLng = parseFloat(db.prepare("SELECT value FROM business_settings WHERE key='business_lng'").get()?.value || '0');

  if (!bizLat || !bizLng) {
    const flat = parseFloat(db.prepare("SELECT value FROM business_settings WHERE key='delivery_charge'").get()?.value || '1500');
    return res.json({ charge: flat, distance_km: null, vehicle_type: 'Standard Truck', truck_trips: 1, total_bricks: totalBricks });
  }

  const distanceKm = Math.round(haversineKm(bizLat, bizLng, parseFloat(lat), parseFloat(lng)) * 10) / 10;
  const result = calculateDeliveryCharge(distanceKm, totalBricks);

  res.json({
    charge: result.charge,
    base_charge: result.base_charge,
    distance_km: distanceKm,
    vehicle_type: result.vehicle_type,
    truck_trips: result.truck_trips,
    multiplier: result.multiplier,
    total_bricks: totalBricks
  });
});

module.exports = router;
