/**
 * sync-to-firestore.mjs
 * One-time script: pushes all SQLite data into Firestore.
 * Run: node sync-to-firestore.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, existsSync } from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'mbi_bricks.db');
const db = new Database(dbPath);

// ── Firebase Admin Init ──────────────────────────────────────────────────────
let adminApp;
const keyPath = path.join(__dirname, 'serviceAccountKey.json');

if (existsSync(keyPath)) {
  const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
  adminApp = initializeApp({ credential: cert(serviceAccount) });
  console.log('✅ Using service account key');
} else {
  adminApp = initializeApp({ projectId: 'mbi-bricks-management' });
  console.log('✅ Using application default credentials');
}

const firestoreDb = getFirestore(adminApp);

async function syncCollection(collectionName, docs) {
  console.log(`\n📦 Syncing ${docs.length} docs → Firestore "${collectionName}"...`);
  let batch = firestoreDb.batch();
  let count = 0;
  for (const docData of docs) {
    const ref = firestoreDb.collection(collectionName).doc(String(docData.id));
    batch.set(ref, docData, { merge: true });
    count++;
    if (count % 499 === 0) {
      await batch.commit();
      batch = firestoreDb.batch();
      console.log(`  ✔ Committed ${count} docs`);
    }
  }
  await batch.commit();
  console.log(`  ✔ Done — ${count} docs synced to "${collectionName}"`);
}

async function main() {
  console.log('🧱 MBI Bricks — SQLite → Firestore Sync\n');

  // Products
  const products = db.prepare('SELECT * FROM products').all();
  await syncCollection('products', products.map(p => ({
    id: String(p.id),
    name: p.name || '',
    name_kn: p.name_kn || '',
    pricePerBrick: p.price || 0,
    price: p.price || 0,
    stockQuantity: p.stock || 0,
    stock: p.stock || 0,
    unit: p.unit || 'piece',
    description: p.description || '',
    category: p.category || '',
    min_order_qty: p.min_order_qty || 0,
    active: p.is_available === 1,
    is_available: p.is_available === 1,
    image: p.image || '',
    createdAt: p.created_at || new Date().toISOString(),
  })));

  // Customers
  const customers = db.prepare(`
    SELECT u.id, u.full_name, u.email, u.phone, u.created_at,
           c.city, c.state, c.pincode, c.total_spent, c.total_orders
    FROM users u JOIN customers c ON c.user_id = u.id
    WHERE u.role = 'customer'
  `).all();
  await syncCollection('customers', customers.map(c => ({
    id: String(c.id),
    name: c.full_name || '',
    full_name: c.full_name || '',
    email: c.email || '',
    phone: c.phone || '',
    city: c.city || '',
    state: c.state || '',
    pincode: c.pincode || '',
    total_spent: c.total_spent || 0,
    total_orders: c.total_orders || 0,
    createdAt: c.created_at || new Date().toISOString(),
  })));

  // Orders
  const orders = db.prepare(`
    SELECT o.*, u.full_name as customer_name, u.phone as customer_phone
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `).all();
  const orderItems = db.prepare('SELECT * FROM order_items').all();
  const itemsByOrder = {};
  for (const item of orderItems) {
    if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
    itemsByOrder[item.order_id].push(item);
  }
  await syncCollection('orders', orders.map(o => ({
    id: String(o.id),
    order_number: o.order_number || '',
    orderNumber: o.order_number || '',
    customerId: String(o.user_id),
    customerName: o.customer_name || '',
    customerPhone: o.customer_phone || '',
    productId: itemsByOrder[o.id]?.[0]?.product_id ? String(itemsByOrder[o.id][0].product_id) : '',
    productName: itemsByOrder[o.id]?.[0]?.product_name || '',
    quantity: itemsByOrder[o.id]?.[0]?.quantity || 0,
    pricePerBrick: itemsByOrder[o.id]?.[0]?.price || 0,
    items: (itemsByOrder[o.id] || []).map(i => ({
      product_id: String(i.product_id),
      product_name: i.product_name || '',
      quantity: i.quantity,
      price: i.price,
      subtotal: i.subtotal,
      unit: i.unit || 'piece',
    })),
    subtotal: o.subtotal || 0,
    delivery_charge: o.delivery_charge || 0,
    totalAmount: o.total || 0,
    total: o.total || 0,
    paymentStatus: o.payment_status || 'pending',
    payment_status: o.payment_status || 'pending',
    payment_method: o.payment_method || 'cod',
    deliveryStatus: o.order_status || 'placed',
    order_status: o.order_status || 'placed',
    delivery_address: [o.delivery_house, o.delivery_street, o.delivery_area, o.delivery_city, o.delivery_state, o.delivery_pincode].filter(Boolean).join(', '),
    notes: o.notes || '',
    orderDate: o.created_at || new Date().toISOString(),
    createdAt: o.created_at || new Date().toISOString(),
  })));

  // Payments
  const payments = db.prepare('SELECT p.*, o.order_number FROM payments p JOIN orders o ON p.order_id = o.id').all();
  await syncCollection('payments', payments.map(p => ({
    id: String(p.id),
    orderId: String(p.order_id),
    order_number: p.order_number || '',
    customerId: String(p.user_id || ''),
    amount: p.amount || 0,
    paymentMethod: p.method || 'cash',
    paymentStatus: 'paid',
    paymentDate: p.created_at || new Date().toISOString(),
    notes: p.notes || '',
  })));

  console.log('\n✅ All data synced to Firestore successfully!\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Sync failed:', err.message);
  process.exit(1);
});
