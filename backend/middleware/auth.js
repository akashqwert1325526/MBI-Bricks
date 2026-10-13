const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mbi_bricks_super_secret_2024';

const authenticate = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({ error: 'Customer access required' });
  }
  next();
};

module.exports = { authenticate, requireAdmin, requireCustomer, JWT_SECRET };
