const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, 'mbi_bricks.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer' CHECK(role IN ('customer', 'admin')),
      full_name TEXT NOT NULL,
      phone TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      city TEXT,
      state TEXT,
      pincode TEXT,
      total_spent REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      label TEXT DEFAULT 'Home',
      house TEXT,
      street TEXT,
      area TEXT,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      pincode TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_kn TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER REFERENCES categories(id),
      name TEXT NOT NULL,
      name_kn TEXT,
      description TEXT,
      description_kn TEXT,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      unit TEXT DEFAULT 'piece',
      stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 1000,
      min_order_qty INTEGER DEFAULT 100,
      image TEXT,
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS wishlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS cart (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id INTEGER NOT NULL REFERENCES cart(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(cart_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL REFERENCES users(id),
      address_id INTEGER REFERENCES addresses(id),
      delivery_house TEXT,
      delivery_street TEXT,
      delivery_area TEXT,
      delivery_city TEXT,
      delivery_state TEXT,
      delivery_pincode TEXT,
      delivery_lat REAL,
      delivery_lng REAL,
      delivery_location_label TEXT,
      delivery_distance_km REAL,
      subtotal REAL NOT NULL,
      delivery_charge REAL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT DEFAULT 'cod',
      payment_status TEXT DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','partially_paid','failed')),
      order_status TEXT DEFAULT 'placed' CHECK(order_status IN ('placed','confirmed','preparing','dispatched','out_for_delivery','delivered','cancelled')),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      product_name TEXT NOT NULL,
      product_name_kn TEXT,
      unit TEXT DEFAULT 'piece',
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      subtotal REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL NOT NULL,
      method TEXT,
      transaction_ref TEXT,
      notes TEXT,
      payment_date TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id),
      generated_at TEXT DEFAULT (datetime('now')),
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER UNIQUE NOT NULL REFERENCES orders(id),
      driver_name TEXT,
      vehicle TEXT,
      expected_date TEXT,
      actual_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','assigned','in_transit','out_for_delivery','delivered')),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER UNIQUE NOT NULL REFERENCES products(id),
      current_stock INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 1000,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id),
      transaction_type TEXT NOT NULL CHECK(transaction_type IN ('added','sale','damaged','returned','adjustment')),
      quantity INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_order_id INTEGER REFERENCES orders(id),
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expense_number TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash',
      expense_date TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS business_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      message TEXT,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migrations for existing databases
  const migrate = (sql) => { try { db.exec(sql); } catch(e) {} };
  migrate(`ALTER TABLE orders ADD COLUMN delivery_lat REAL`);
  migrate(`ALTER TABLE orders ADD COLUMN delivery_lng REAL`);
  migrate(`ALTER TABLE orders ADD COLUMN delivery_location_label TEXT`);
  migrate(`ALTER TABLE orders ADD COLUMN delivery_distance_km REAL`);
  migrate(`ALTER TABLE orders ADD COLUMN vehicle_type TEXT`);
  migrate(`ALTER TABLE orders ADD COLUMN truck_trips INTEGER DEFAULT 1`);
  migrate(`ALTER TABLE orders ADD COLUMN total_bricks INTEGER DEFAULT 0`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('owner_whatsapp','+919876543210')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('business_lat','13.6950')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('business_lng','76.3936')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('delivery_rate_mode','distance')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('delivery_rate_tiers','[{"max_km":10,"charge":500},{"max_km":25,"charge":1000},{"max_km":50,"charge":1500},{"max_km":100,"charge":2500},{"max_km":9999,"charge":4000}]')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('standard_truck_capacity','5000')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('capacity_pricing_enabled','true')`);
  migrate(`INSERT OR IGNORE INTO business_settings (key,value) VALUES ('vehicle_rate_tiers','[{"name":"Mini Truck / Small (Up to 2,500 pcs)","max_bricks":2500,"multiplier":0.8,"extra_charge":0},{"name":"Standard 6-Wheeler (2,501 - 5,000 pcs)","max_bricks":5000,"multiplier":1.0,"extra_charge":0},{"name":"Heavy 10-Wheeler (5,001 - 10,000 pcs)","max_bricks":10000,"multiplier":1.8,"extra_charge":500},{"name":"Fleet / Bulk (> 10,000 pcs)","max_bricks":999999,"multiplier":2.5,"extra_charge":1000}]')`);

  console.log('✅ Database tables initialized');

}

async function seedDatabase() {
  const existingAdmin = db.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get();
  if (existingAdmin) {
    console.log('✅ Database already seeded');
    return;
  }

  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('admin123', 12);
  const adminResult = db.prepare(`
    INSERT INTO users (email, password, role, full_name, phone)
    VALUES (?, ?, 'admin', 'Nandakumar B C', '9876543210')
  `).run('admin@mbibricks.com', adminPassword);

  // Categories
  const catResult = db.prepare(`
    INSERT INTO categories (name, name_kn, slug, description) VALUES
    ('Wirecut Bricks', 'ವೈರ್ಕಟ್ ಇಟ್ಟಿಗೆಗಳು', 'wirecut-bricks', 'High-quality wirecut bricks'),
    ('Box Bricks', 'ಬಾಕ್ಸ್ ಇಟ್ಟಿಗೆಗಳು', 'box-bricks', 'Quality box bricks')
  `).run();

  const wirecut = db.prepare("SELECT id FROM categories WHERE slug='wirecut-bricks'").get();
  const box = db.prepare("SELECT id FROM categories WHERE slug='box-bricks'").get();

  // Products
  const p1 = db.prepare(`
    INSERT INTO products (category_id, name, name_kn, description, description_kn, price, cost_price, unit, stock, min_stock, min_order_qty, is_available, is_featured)
    VALUES (?, 'Wirecut Bricks', 'ವೈರ್ಕಟ್ ಇಟ್ಟಿಗೆಗಳು',
      'High-quality wirecut bricks suitable for construction projects. These bricks are manufactured using wire-cutting technology ensuring uniform size and superior strength.',
      'ನಿರ್ಮಾಣ ಕಾಮಗಾರಿಗಳಿಗೆ ಸೂಕ್ತವಾದ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ವೈರ್ಕಟ್ ಇಟ್ಟಿಗೆಗಳು.',
      7.5, 5.0, 'piece', 50000, 10000, 500, 1, 1)
  `).run(wirecut.id);

  const p2 = db.prepare(`
    INSERT INTO products (category_id, name, name_kn, description, description_kn, price, cost_price, unit, stock, min_stock, min_order_qty, is_available, is_featured)
    VALUES (?, 'Box Bricks', 'ಬಾಕ್ಸ್ ಇಟ್ಟಿಗೆಗಳು',
      'Quality box bricks suitable for various construction requirements. Manufactured to standard specifications with excellent load-bearing capacity.',
      'ವಿವಿಧ ನಿರ್ಮಾಣ ಅಗತ್ಯಗಳಿಗೆ ಸೂಕ್ತವಾದ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಬಾಕ್ಸ್ ಇಟ್ಟಿಗೆಗಳು.',
      6.0, 4.0, 'piece', 30000, 8000, 500, 1, 1)
  `).run(box.id);

  // Inventory records
  db.prepare(`INSERT INTO inventory (product_id, current_stock, min_stock) VALUES (?, 50000, 10000)`).run(p1.lastInsertRowid);
  db.prepare(`INSERT INTO inventory (product_id, current_stock, min_stock) VALUES (?, 30000, 8000)`).run(p2.lastInsertRowid);

  // Seed customers
  const c1pw = await bcrypt.hash('password123', 10);
  const c1 = db.prepare(`INSERT INTO users (email, password, role, full_name, phone) VALUES ('ravi@example.com', ?, 'customer', 'Ravi Kumar', '9000000001')`).run(c1pw);
  const c2 = db.prepare(`INSERT INTO users (email, password, role, full_name, phone) VALUES ('suresh@example.com', ?, 'customer', 'Suresh B', '9000000002')`).run(c1pw);
  const c3 = db.prepare(`INSERT INTO users (email, password, role, full_name, phone) VALUES ('manjunath@example.com', ?, 'customer', 'Manjunath', '9000000003')`).run(c1pw);
  const c4 = db.prepare(`INSERT INTO users (email, password, role, full_name, phone) VALUES ('priya@constructions.com', ?, 'customer', 'Priya Constructions', '9000000004')`).run(c1pw);

  db.prepare(`INSERT INTO customers (user_id, city, state, pincode) VALUES (?, 'Bengaluru', 'Karnataka', '560001')`).run(c1.lastInsertRowid);
  db.prepare(`INSERT INTO customers (user_id, city, state, pincode) VALUES (?, 'Mysuru', 'Karnataka', '570001')`).run(c2.lastInsertRowid);
  db.prepare(`INSERT INTO customers (user_id, city, state, pincode) VALUES (?, 'Hubballi', 'Karnataka', '580001')`).run(c3.lastInsertRowid);
  db.prepare(`INSERT INTO customers (user_id, city, state, pincode) VALUES (?, 'Mangaluru', 'Karnataka', '575001')`).run(c4.lastInsertRowid);

  // Addresses
  const a1 = db.prepare(`INSERT INTO addresses (user_id, house, street, area, city, state, pincode, is_default) VALUES (?, '12, MG Road', 'Brigade Road', 'Central', 'Bengaluru', 'Karnataka', '560001', 1)`).run(c1.lastInsertRowid);
  const a2 = db.prepare(`INSERT INTO addresses (user_id, house, street, area, city, state, pincode, is_default) VALUES (?, '34, KRS Road', 'Jayalakshmipuram', 'West', 'Mysuru', 'Karnataka', '570001', 1)`).run(c2.lastInsertRowid);
  const a3 = db.prepare(`INSERT INTO addresses (user_id, house, street, area, city, state, pincode, is_default) VALUES (?, '56, Gokul Road', 'Vidyanagar', 'North', 'Hubballi', 'Karnataka', '580001', 1)`).run(c3.lastInsertRowid);
  const a4 = db.prepare(`INSERT INTO addresses (user_id, house, street, area, city, state, pincode, is_default) VALUES (?, '78, Car Street', 'Hampankatta', 'Center', 'Mangaluru', 'Karnataka', '575001', 1)`).run(c4.lastInsertRowid);

  // Demo orders
  const orders = [
    { userId: c1.lastInsertRowid, addrId: a1.lastInsertRowid, num: 'MBI1001', status: 'delivered', payStatus: 'paid', payMethod: 'upi', items: [{pid: p1.lastInsertRowid, name: 'Wirecut Bricks', nameKn: 'ವೈರ್ಕಟ್ ಇಟ್ಟಿಗೆಗಳು', qty: 5000, price: 7.5}] },
    { userId: c2.lastInsertRowid, addrId: a2.lastInsertRowid, num: 'MBI1002', status: 'preparing', payStatus: 'paid', payMethod: 'bank_transfer', items: [{pid: p1.lastInsertRowid, name: 'Wirecut Bricks', nameKn: 'ವೈರ್ಕಟ್ ಇಟ್ಟಿಗೆಗಳು', qty: 2000, price: 7.5}, {pid: p2.lastInsertRowid, name: 'Box Bricks', nameKn: 'ಬಾಕ್ಸ್ ಇಟ್ಟಿಗೆಗಳು', qty: 1000, price: 6.0}] },
    { userId: c3.lastInsertRowid, addrId: a3.lastInsertRowid, num: 'MBI1003', status: 'confirmed', payStatus: 'partially_paid', payMethod: 'cod', items: [{pid: p2.lastInsertRowid, name: 'Box Bricks', nameKn: 'ಬಾಕ್ಸ್ ಇಟ್ಟಿಗೆಗಳು', qty: 3000, price: 6.0}] },
    { userId: c4.lastInsertRowid, addrId: a4.lastInsertRowid, num: 'MBI1004', status: 'placed', payStatus: 'pending', payMethod: 'cod', items: [{pid: p1.lastInsertRowid, name: 'Wirecut Bricks', nameKn: 'ವೈರ್ಕಟ್ ಇಟ್ಟಿಗೆಗಳು', qty: 10000, price: 7.5}] },
    { userId: c1.lastInsertRowid, addrId: a1.lastInsertRowid, num: 'MBI1005', status: 'dispatched', payStatus: 'paid', payMethod: 'upi', items: [{pid: p2.lastInsertRowid, name: 'Box Bricks', nameKn: 'ಬಾಕ್ಸ್ ಇಟ್ಟಿಗೆಗಳು', qty: 2000, price: 6.0}] },
  ];

  let orderCounter = 1006;
  for (const o of orders) {
    const subtotal = o.items.reduce((s, i) => s + i.qty * i.price, 0);
    const delivery = 1500;
    const total = subtotal + delivery;
    const ord = db.prepare(`
      INSERT INTO orders (order_number, user_id, address_id, delivery_house, delivery_street, delivery_area, delivery_city, delivery_state, delivery_pincode, subtotal, delivery_charge, total, payment_method, payment_status, order_status, created_at)
      SELECT ?, ?, ?, house, street, area, city, state, pincode, ?, ?, ?, ?, ?, ?, datetime('now', '-' || (abs(random()) % 30) || ' days')
      FROM addresses WHERE id=?
    `).run(o.num, o.userId, o.addrId, subtotal, delivery, total, o.payMethod, o.payStatus, o.status, o.addrId);

    for (const item of o.items) {
      db.prepare(`INSERT INTO order_items (order_id, product_id, product_name, product_name_kn, unit, quantity, price, subtotal) VALUES (?,?,?,?,'piece',?,?,?)`).run(ord.lastInsertRowid, item.pid, item.name, item.nameKn, item.qty, item.price, item.qty * item.price);
    }

    if (o.payStatus === 'paid') {
      db.prepare(`INSERT INTO payments (order_id, user_id, amount, method, payment_date) VALUES (?,?,?,?,datetime('now'))`).run(ord.lastInsertRowid, o.userId, total, o.payMethod);
    } else if (o.payStatus === 'partially_paid') {
      db.prepare(`INSERT INTO payments (order_id, user_id, amount, method, payment_date) VALUES (?,?,?,?,datetime('now'))`).run(ord.lastInsertRowid, o.userId, total * 0.4, o.payMethod);
    }

    // Invoice for confirmed+ orders
    if (['confirmed','preparing','dispatched','out_for_delivery','delivered'].includes(o.status)) {
      db.prepare(`INSERT INTO invoices (invoice_number, order_id) VALUES (?,?)`).run('INV-' + o.num, ord.lastInsertRowid);
    }

    // Delivery for dispatched+
    if (['dispatched','out_for_delivery','delivered'].includes(o.status)) {
      const dStatus = o.status === 'dispatched' ? 'assigned' : o.status === 'out_for_delivery' ? 'out_for_delivery' : 'delivered';
      db.prepare(`INSERT INTO deliveries (order_id, driver_name, vehicle, status) VALUES (?,?,?,?)`).run(ord.lastInsertRowid, 'Ramesh', 'KA-01-AB-1234', dStatus);
    }
  }

  // Update inventory for sold items
  db.prepare(`UPDATE inventory SET current_stock = current_stock - 5000 WHERE product_id=?`).run(p1.lastInsertRowid);
  db.prepare(`UPDATE inventory SET current_stock = current_stock - 2000 WHERE product_id=?`).run(p1.lastInsertRowid);
  db.prepare(`UPDATE inventory SET current_stock = current_stock - 10000 WHERE product_id=?`).run(p1.lastInsertRowid);
  db.prepare(`UPDATE inventory SET current_stock = current_stock - 1000 WHERE product_id=?`).run(p2.lastInsertRowid);
  db.prepare(`UPDATE inventory SET current_stock = current_stock - 3000 WHERE product_id=?`).run(p2.lastInsertRowid);
  db.prepare(`UPDATE inventory SET current_stock = current_stock - 2000 WHERE product_id=?`).run(p2.lastInsertRowid);

  // Update products stock
  db.prepare(`UPDATE products SET stock = (SELECT current_stock FROM inventory WHERE product_id=products.id)`).run();

  // Expenses
  const expenseCategories = ['Fuel', 'Labour', 'Electricity', 'Vehicle Maintenance', 'Transportation'];
  const expenseDescs = ['Diesel for truck', 'Daily labour wages', 'Monthly electricity bill', 'Truck service', 'Delivery charges'];
  const amounts = [4500, 12000, 3200, 8500, 5000];
  for (let i = 0; i < 5; i++) {
    db.prepare(`INSERT INTO expenses (expense_number, category, description, amount, payment_method, expense_date) VALUES (?,?,?,?,'cash',date('now', '-' || ? || ' days'))`)
      .run(`EXP${String(i+1).padStart(4,'0')}`, expenseCategories[i], expenseDescs[i], amounts[i], i * 3);
  }

  // Business settings
  const settings = [
    ['business_name', 'MBI Bricks Industries'],
    ['owner_name', 'Nandakumar B C'],
    ['owner_whatsapp', '+919876543210'],
    ['location_tag', 'H96P+4X5'],
    ['business_lat', '13.6950'],
    ['business_lng', '76.3936'],
    ['business_address', 'H96P+4X5, Bommenahalli, Handanakere Hobli, C N Halli Tq, Karnataka 572119'],
    ['google_maps_url', 'https://www.google.com/maps/search/?api=1&query=H96P%2B4X5'],
    ['business_phone', '+91 98765 43210'],
    ['business_email', 'contact@mbibricks.com'],
    ['delivery_charge', '1500'],
    ['delivery_rate_mode', 'distance'],
    ['delivery_rate_tiers', JSON.stringify([
      { max_km: 10, charge: 500 },
      { max_km: 25, charge: 1000 },
      { max_km: 50, charge: 1500 },
      { max_km: 100, charge: 2500 },
      { max_km: 9999, charge: 4000 }
    ])],
    ['gst_number', '29XXXXX0000X1ZX'],
    ['currency', 'INR'],
    ['order_prefix', 'MBI'],
    ['next_order_number', '1006'],
  ];
  for (const [key, value] of settings) {
    db.prepare(`INSERT OR IGNORE INTO business_settings (key, value) VALUES (?,?)`).run(key, value);
  }

  // Update customer stats
  db.prepare(`UPDATE customers SET total_orders=2, total_spent=37500+12000 WHERE user_id=?`).run(c1.lastInsertRowid);
  db.prepare(`UPDATE customers SET total_orders=1, total_spent=21000 WHERE user_id=?`).run(c2.lastInsertRowid);
  db.prepare(`UPDATE customers SET total_orders=1, total_spent=18000 WHERE user_id=?`).run(c3.lastInsertRowid);
  db.prepare(`UPDATE customers SET total_orders=1, total_spent=75000 WHERE user_id=?`).run(c4.lastInsertRowid);

  console.log('✅ Database seeded successfully');
  console.log('   Admin: admin@mbibricks.com / admin123');
  console.log('   Customer: ravi@example.com / password123');
}

module.exports = { db, initializeDatabase, seedDatabase };
