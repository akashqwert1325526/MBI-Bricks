const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { JWT_SECRET } = require('../middleware/auth');

// Register customer
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, city, state, pincode } = req.body;
    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email=?').get(email);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const hash = await bcrypt.hash(password, 12);
    const userResult = db.prepare(`
      INSERT INTO users (full_name, email, phone, password, role) VALUES (?,?,?,?,'customer')
    `).run(full_name, email, phone, hash);

    db.prepare(`
      INSERT INTO customers (user_id, city, state, pincode) VALUES (?,?,?,?)
    `).run(userResult.lastInsertRowid, city || '', state || '', pincode || '');

    const user = db.prepare('SELECT id, email, full_name, role, phone FROM users WHERE id=?').get(userResult.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login (customer + admin)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email=? AND is_active=1').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
router.get('/me', require('../middleware/auth').authenticate, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, role, phone, is_active FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Change password
router.post('/change-password', require('../middleware/auth').authenticate, async (req, res) => {
  const { current_password, new_password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  const valid = await bcrypt.compare(current_password, user.password);
  if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
  const hash = await bcrypt.hash(new_password, 12);
  db.prepare('UPDATE users SET password=? WHERE id=?').run(hash, req.user.id);
  res.json({ message: 'Password changed' });
});

// Update profile
router.put('/profile', require('../middleware/auth').authenticate, (req, res) => {
  const { full_name, phone } = req.body;
  db.prepare(`UPDATE users SET full_name=?, phone=?, updated_at=datetime('now') WHERE id=?`).run(full_name, phone, req.user.id);
  const user = db.prepare('SELECT id, email, full_name, role, phone FROM users WHERE id=?').get(req.user.id);
  res.json(user);
});

// Sync Firebase user to local DB and return a JWT
router.post('/firebase-sync', async (req, res) => {
  try {
    const { uid, email, full_name, role } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    let user = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (!user) {
      // Create a local user with a random password (they auth via Firebase)
      const hash = await bcrypt.hash(uid || 'firebase_' + Date.now(), 12);
      const result = db.prepare(
        `INSERT INTO users (full_name, email, phone, password, role) VALUES (?,?,?,?,?)`
      ).run(full_name || email.split('@')[0], email, '', hash, role || 'customer');

      db.prepare(
        `INSERT INTO customers (user_id, city, state, pincode) VALUES (?,?,?,?)`
      ).run(result.lastInsertRowid, '', '', '');

      user = db.prepare('SELECT * FROM users WHERE id=?').get(result.lastInsertRowid);
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.full_name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, phone: user.phone }
    });
  } catch (err) {
    console.error('Firebase sync error:', err);
    res.status(500).json({ error: 'Firebase sync failed' });
  }
});

module.exports = router;
