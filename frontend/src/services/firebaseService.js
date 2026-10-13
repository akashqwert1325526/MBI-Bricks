import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  runTransaction,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import api from '../api';

// Helper to sanitize Firestore documents into JS objects with string id
const formatDoc = (docSnap) => {
  if (!docSnap.exists()) return null;
  const data = docSnap.data();
  return {
    id: String(docSnap.id),
    ...data,
    createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate().toISOString() : data.createdAt,
    orderDate: data.orderDate?.toDate?.() ? data.orderDate.toDate().toISOString() : data.orderDate,
    paymentDate: data.paymentDate?.toDate?.() ? data.paymentDate.toDate().toISOString() : data.paymentDate,
    updatedAt: data.updatedAt?.toDate?.() ? data.updatedAt.toDate().toISOString() : data.updatedAt,
  };
};

// ==========================================
// SEED INITIAL PRODUCTS (Firestore only)
// ==========================================
export const seedInitialProducts = async () => {
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    if (snapshot.empty) {
      const initialProducts = [
        {
          name: 'Wirecut Brick',
          name_kn: 'ವೈರ್‌ಕಟ್ ಇಟ್ಟಿಗೆ',
          pricePerBrick: 9.0,
          price: 9.0,
          stockQuantity: 50000,
          stock: 50000,
          unit: 'piece',
          description: 'High-density premium machine cut wirecut red clay bricks.',
          category: 'wirecut',
          active: true,
          is_available: true,
          min_order_qty: 500,
          image: '',
          createdAt: new Date().toISOString()
        },
        {
          name: 'Table Mould Brick',
          name_kn: 'ಟೇಬಲ್ ಮೌಲ್ಡ್ ಇಟ್ಟಿಗೆ',
          pricePerBrick: 8.0,
          price: 8.0,
          stockQuantity: 35000,
          stock: 35000,
          unit: 'piece',
          description: 'Traditional handcrafted high strength table moulded red bricks.',
          category: 'table_mould',
          active: true,
          is_available: true,
          min_order_qty: 500,
          image: '',
          createdAt: new Date().toISOString()
        }
      ];
      for (const prod of initialProducts) {
        await addDoc(productsRef, prod);
      }
    }
  } catch (err) {
    console.warn('Firestore product seeding skipped:', err.message);
  }
};

// ==========================================
// PRODUCTS API (Firestore + SQLite Backend Dual Mode)
// ==========================================
export const getProducts = async () => {
  // 1. Try Firestore first
  try {
    const productsRef = collection(db, 'products');
    const snapshot = await getDocs(productsRef);
    if (!snapshot.empty) {
      return snapshot.docs.map(formatDoc);
    }
  } catch (fsErr) {
    console.warn('Firestore products unavailable, switching to SQLite backend:', fsErr.message);
  }

  // 2. Seamless Fallback to SQLite Backend API
  try {
    const res = await api.get('/products');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(p => ({
      id: String(p.id),
      name: p.name,
      name_kn: p.name_kn,
      pricePerBrick: Number(p.price || 0),
      price: Number(p.price || 0),
      stockQuantity: Number(p.stock ?? p.inventory_stock ?? 0),
      stock: Number(p.stock ?? p.inventory_stock ?? 0),
      unit: p.unit || 'piece',
      description: p.description || '',
      category: p.category_slug || p.category_name || '',
      min_order_qty: p.min_order_qty || 0,
      active: Boolean(p.is_available),
      is_available: Boolean(p.is_available),
      image: p.image_url || p.image || '',
      createdAt: p.created_at || new Date().toISOString()
    }));
  } catch (apiErr) {
    console.error('Products API error:', apiErr);
    return [];
  }
};

export const getProductById = async (id) => {
  try {
    const docRef = doc(db, 'products', String(id));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return formatDoc(docSnap);
  } catch (e) {
    // ignore
  }

  try {
    const res = await api.get(`/products/${id}`);
    const p = res.data;
    if (p) {
      return {
        id: String(p.id),
        name: p.name,
        name_kn: p.name_kn,
        pricePerBrick: Number(p.price || 0),
        price: Number(p.price || 0),
        stockQuantity: Number(p.stock ?? p.inventory_stock ?? 0),
        stock: Number(p.stock ?? p.inventory_stock ?? 0),
        unit: p.unit || 'piece',
        description: p.description || '',
        category: p.category_slug || '',
        active: Boolean(p.is_available),
        is_available: Boolean(p.is_available),
        image: p.image_url || p.image || '',
        createdAt: p.created_at
      };
    }
  } catch (err) {
    console.error('Get product error:', err);
  }
  return null;
};

export const addProduct = async (productData) => {
  const price = Number(productData.pricePerBrick || productData.price || 0);
  const stock = Number(productData.stockQuantity || productData.stock || 0);

  // Try Firestore
  try {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      name: productData.name || '',
      name_kn: productData.name_kn || '',
      pricePerBrick: price,
      price: price,
      stockQuantity: stock,
      stock: stock,
      unit: productData.unit || 'piece',
      description: productData.description || '',
      category: productData.category || '',
      min_order_qty: Number(productData.min_order_qty || 0),
      active: productData.active !== undefined ? Boolean(productData.active) : true,
      is_available: productData.active !== undefined ? Boolean(productData.active) : true,
      image: productData.image || '',
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (fsErr) {
    console.warn('Firestore addProduct failed, saving to backend SQLite:', fsErr.message);
  }

  // Fallback to SQLite Backend API
  try {
    const res = await api.post('/products', {
      name: productData.name,
      name_kn: productData.name_kn,
      price,
      stock,
      unit: productData.unit || 'piece',
      description: productData.description,
      min_order_qty: productData.min_order_qty || 500,
      is_available: productData.active ? 1 : 0
    });
    return String(res.data?.id || Date.now());
  } catch (apiErr) {
    console.error('API addProduct error:', apiErr);
    throw apiErr;
  }
};

export const updateProduct = async (id, productData) => {
  // Try Firestore
  try {
    const docRef = doc(db, 'products', String(id));
    const updatePayload = { updatedAt: new Date().toISOString() };
    if (productData.name !== undefined) updatePayload.name = productData.name;
    if (productData.name_kn !== undefined) updatePayload.name_kn = productData.name_kn;
    if (productData.pricePerBrick !== undefined || productData.price !== undefined) {
      const p = Number(productData.pricePerBrick ?? productData.price);
      updatePayload.pricePerBrick = p;
      updatePayload.price = p;
    }
    if (productData.stockQuantity !== undefined || productData.stock !== undefined) {
      const s = Number(productData.stockQuantity ?? productData.stock);
      updatePayload.stockQuantity = s;
      updatePayload.stock = s;
    }
    if (productData.unit !== undefined) updatePayload.unit = productData.unit;
    if (productData.description !== undefined) updatePayload.description = productData.description;
    if (productData.category !== undefined) updatePayload.category = productData.category;
    if (productData.min_order_qty !== undefined) updatePayload.min_order_qty = Number(productData.min_order_qty);
    if (productData.active !== undefined) {
      updatePayload.active = Boolean(productData.active);
      updatePayload.is_available = Boolean(productData.active);
    }
    if (productData.image !== undefined) updatePayload.image = productData.image;
    await updateDoc(docRef, updatePayload);
  } catch (fsErr) {
    console.warn('Firestore updateProduct fallback to SQLite API:', fsErr.message);
  }

  // Also sync to SQLite Backend API
  try {
    const payload = {};
    if (productData.name !== undefined) payload.name = productData.name;
    if (productData.pricePerBrick !== undefined || productData.price !== undefined) {
      payload.price = Number(productData.pricePerBrick ?? productData.price);
    }
    if (productData.stockQuantity !== undefined || productData.stock !== undefined) {
      payload.stock = Number(productData.stockQuantity ?? productData.stock);
    }
    if (productData.unit !== undefined) payload.unit = productData.unit;
    if (productData.description !== undefined) payload.description = productData.description;
    if (productData.active !== undefined) payload.is_available = productData.active ? 1 : 0;
    await api.put(`/products/${id}`, payload);
  } catch (apiErr) {
    // silent if already updated in Firestore
  }
};

export const deleteProduct = async (id) => {
  try {
    const docRef = doc(db, 'products', String(id));
    await deleteDoc(docRef);
  } catch (fsErr) {
    console.warn('Firestore deleteProduct fallback:', fsErr.message);
  }

  try {
    await api.delete(`/products/${id}`);
  } catch (apiErr) {
    // silent
  }
};

// ==========================================
// CUSTOMERS API (Firestore + SQLite Backend Dual Mode)
// ==========================================
export const getCustomers = async () => {
  // 1. Try Firestore first
  try {
    const customersRef = collection(db, 'customers');
    const snapshot = await getDocs(customersRef);
    if (!snapshot.empty) {
      return snapshot.docs.map(formatDoc);
    }
  } catch (fsErr) {
    console.warn('Firestore customers unavailable, switching to SQLite backend:', fsErr.message);
  }

  // 2. Seamless Fallback to SQLite Backend API
  try {
    const res = await api.get('/customers');
    const list = Array.isArray(res.data) ? res.data : [];
    return list.map(c => ({
      id: String(c.id),
      name: c.full_name || 'Customer',
      full_name: c.full_name || 'Customer',
      email: c.email || '',
      phone: c.phone || '',
      city: c.city || '',
      state: c.state || '',
      pincode: c.pincode || '',
      address: [c.city, c.state, c.pincode].filter(Boolean).join(', ') || 'Karnataka, India',
      total_spent: Number(c.total_spent || 0),
      total_orders: Number(c.total_orders || 0),
      pending_amount: Number(c.pending_amount || 0),
      createdAt: c.created_at || new Date().toISOString()
    }));
  } catch (apiErr) {
    console.error('Customers API error:', apiErr);
    return [];
  }
};

export const getCustomerById = async (id) => {
  try {
    const docRef = doc(db, 'customers', String(id));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return formatDoc(docSnap);
  } catch (e) {}

  try {
    const res = await api.get(`/customers/${id}`);
    const c = res.data;
    if (c) {
      return {
        id: String(c.id),
        name: c.full_name || 'Customer',
        full_name: c.full_name || 'Customer',
        email: c.email || '',
        phone: c.phone || '',
        city: c.city || '',
        state: c.state || '',
        pincode: c.pincode || '',
        address: [c.city, c.state, c.pincode].filter(Boolean).join(', '),
        total_spent: Number(c.total_spent || 0),
        total_orders: Number(c.total_orders || 0),
        orders: c.orders || [],
        payments: c.payments || [],
        addresses: c.addresses || []
      };
    }
  } catch (err) {}
  return null;
};

export const addCustomer = async (customerData) => {
  const name = customerData.name || customerData.full_name || '';
  try {
    const customersRef = collection(db, 'customers');
    const docRef = await addDoc(customersRef, {
      name,
      full_name: name,
      email: customerData.email || '',
      phone: customerData.phone || '',
      city: customerData.city || '',
      state: customerData.state || '',
      pincode: customerData.pincode || '',
      address: customerData.address || [customerData.city, customerData.state, customerData.pincode].filter(Boolean).join(', '),
      total_spent: Number(customerData.total_spent || 0),
      total_orders: Number(customerData.total_orders || 0),
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (fsErr) {
    console.warn('Firestore addCustomer fallback to backend API:', fsErr.message);
  }

  try {
    const res = await api.post('/auth/register', {
      full_name: name,
      email: customerData.email || `customer_${Date.now()}@example.com`,
      phone: customerData.phone,
      password: 'password123',
      city: customerData.city,
      pincode: customerData.pincode
    });
    return String(res.data?.user?.id || Date.now());
  } catch (apiErr) {
    return String(Date.now());
  }
};

export const updateCustomer = async (id, customerData) => {
  try {
    const docRef = doc(db, 'customers', String(id));
    const payload = { updatedAt: new Date().toISOString() };
    if (customerData.name !== undefined) { payload.name = customerData.name; payload.full_name = customerData.name; }
    if (customerData.full_name !== undefined) { payload.name = customerData.full_name; payload.full_name = customerData.full_name; }
    if (customerData.email !== undefined) payload.email = customerData.email;
    if (customerData.phone !== undefined) payload.phone = customerData.phone;
    if (customerData.city !== undefined) payload.city = customerData.city;
    if (customerData.address !== undefined) payload.address = customerData.address;
    await updateDoc(docRef, payload);
  } catch (fsErr) {
    console.warn('Firestore updateCustomer fallback:', fsErr.message);
  }

  try {
    await api.put(`/customers/${id}/status`, { is_active: 1 });
  } catch (e) {}
};

export const deleteCustomer = async (id) => {
  try {
    const docRef = doc(db, 'customers', String(id));
    await deleteDoc(docRef);
  } catch (e) {}
};

export const searchCustomers = async (searchQuery) => {
  const customers = await getCustomers();
  if (!searchQuery) return customers;
  const q = searchQuery.toLowerCase();
  return customers.filter(c =>
    c.name?.toLowerCase().includes(q) ||
    c.full_name?.toLowerCase().includes(q) ||
    c.email?.toLowerCase().includes(q) ||
    c.phone?.includes(q) ||
    c.city?.toLowerCase().includes(q) ||
    c.address?.toLowerCase().includes(q)
  );
};

// ==========================================
// ORDERS API (Firestore + SQLite Backend Dual Mode)
// ==========================================
export const createOrderWithStockTransaction = async ({
  customerId,
  productId,
  quantity,
  pricePerBrick,
  paymentStatus = 'pending',
  deliveryStatus = 'placed',
  notes = '',
  delivery_address = ''
}) => {
  const qty = Number(quantity);
  const unitPrice = Number(pricePerBrick);
  if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be greater than 0');

  // Try Firestore Transaction
  try {
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', String(productId));
      const productDoc = await transaction.get(productRef);
      if (!productDoc.exists()) throw new Error('Product not found in Firestore');

      const productData = productDoc.data();
      const currentStock = Number(productData.stockQuantity || productData.stock || 0);
      if (currentStock < qty) {
        throw new Error(`Insufficient stock for ${productData.name}. Current stock: ${currentStock}`);
      }

      const newStock = currentStock - qty;
      const customerRef = doc(db, 'customers', String(customerId));
      const customerDoc = await transaction.get(customerRef);
      const customerData = customerDoc.exists() ? customerDoc.data() : {};

      const totalAmount = qty * unitPrice;
      const orderNumber = `MBI${Date.now().toString().slice(-4)}`;
      const orderDate = new Date().toISOString();

      transaction.update(productRef, {
        stockQuantity: newStock,
        stock: newStock,
        updatedAt: orderDate
      });

      if (customerDoc.exists()) {
        transaction.update(customerRef, {
          total_orders: (Number(customerData.total_orders) || 0) + 1,
          total_spent: (Number(customerData.total_spent) || 0) + totalAmount,
          updatedAt: orderDate
        });
      }

      const ordersRef = collection(db, 'orders');
      const newOrderRef = doc(ordersRef);

      const resolvedAddress = delivery_address ||
        [customerData.city, customerData.state, customerData.pincode].filter(Boolean).join(', ');

      const orderData = {
        customerId,
        customerName: customerData.name || customerData.full_name || 'Customer',
        customerPhone: customerData.phone || '',
        productId,
        productName: productData.name || 'Bricks',
        quantity: qty,
        pricePerBrick: unitPrice,
        totalAmount,
        total: totalAmount,
        subtotal: totalAmount,
        delivery_charge: 0,
        paymentStatus,
        payment_status: paymentStatus,
        payment_method: 'cod',
        deliveryStatus,
        order_status: deliveryStatus,
        delivery_address: resolvedAddress,
        orderDate,
        createdAt: orderDate,
        orderNumber,
        order_number: orderNumber,
        items: [{
          product_id: productId,
          product_name: productData.name || 'Bricks',
          quantity: qty,
          price: unitPrice,
          subtotal: totalAmount,
          unit: productData.unit || 'piece'
        }],
        notes
      };

      transaction.set(newOrderRef, orderData);
      return { id: newOrderRef.id, ...orderData };
    });
  } catch (fsErr) {
    console.warn('Firestore transaction fallback to SQLite API:', fsErr.message);
  }

  // Fallback to SQLite Backend API
  try {
    const payload = {
      address_id: null,
      delivery_address: { street: delivery_address || 'Factory Pickup', city: 'Bengaluru', pincode: '560001' },
      payment_method: 'cod',
      notes
    };
    const res = await api.post('/orders', payload);
    return {
      id: String(res.data.order_id),
      orderNumber: res.data.order_number,
      order_number: res.data.order_number,
      totalAmount: res.data.total,
      total: res.data.total
    };
  } catch (apiErr) {
    console.error('API create order error:', apiErr);
    throw apiErr;
  }
};

export const getOrders = async () => {
  // 1. Fetch from SQLite backend
  let apiOrders = [];
  try {
    const res = await api.get('/orders/admin/all?limit=100');
    apiOrders = (res.data?.orders || []).map(o => ({
      id: String(o.id),
      orderNumber: o.order_number,
      order_number: o.order_number,
      customerId: String(o.user_id),
      customerName: o.customer_name || 'Customer',
      customerPhone: o.customer_phone || '',
      productName: o.items_summary || 'Bricks',
      quantity: 0,
      totalAmount: Number(o.total || 0),
      total: Number(o.total || 0),
      subtotal: Number(o.subtotal || 0),
      deliveryCharge: Number(o.delivery_charge || 0),
      paymentStatus: o.payment_status || 'pending',
      payment_status: o.payment_status || 'pending',
      deliveryStatus: o.order_status || 'placed',
      order_status: o.order_status || 'placed',
      delivery_lat: o.delivery_lat,
      delivery_lng: o.delivery_lng,
      delivery_location_label: o.delivery_location_label,
      delivery_distance_km: o.delivery_distance_km,
      delivery_address: [o.delivery_house, o.delivery_street, o.delivery_area, o.delivery_city, o.delivery_state, o.delivery_pincode].filter(Boolean).join(', '),
      createdAt: o.created_at,
      orderDate: o.created_at,
      source: 'api'
    }));
  } catch (e) {
    console.warn('API orders error:', e.message);
  }

  // 2. Fetch from Firestore (silent on error)
  let fsOrders = [];
  try {
    const ordersRef = collection(db, 'orders');
    const snapshot = await getDocs(ordersRef);
    fsOrders = snapshot.docs.map(formatDoc);
  } catch (e) {
    console.warn('Firestore orders unavailable:', e.message);
  }

  // Merge and deduplicate
  const seen = new Set();
  const merged = [];

  for (const o of [...apiOrders, ...fsOrders]) {
    const key = o.orderNumber || o.order_number || o.id;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(o);
    }
  }

  return merged.sort((a, b) => new Date(b.createdAt || b.orderDate || 0) - new Date(a.createdAt || a.orderDate || 0));
};

export const getOrderById = async (id) => {
  try {
    const docRef = doc(db, 'orders', String(id));
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) return formatDoc(docSnap);
  } catch (e) {}

  try {
    const res = await api.get(`/orders/admin/${id}`);
    const o = res.data;
    if (o) {
      return {
        id: String(o.id),
        orderNumber: o.order_number,
        order_number: o.order_number,
        customerName: o.customer_name || 'Customer',
        customerPhone: o.customer_phone || '',
        customerEmail: o.customer_email || '',
        totalAmount: Number(o.total || 0),
        total: Number(o.total || 0),
        subtotal: Number(o.subtotal || 0),
        deliveryCharge: Number(o.delivery_charge || 0),
        paymentStatus: o.payment_status || 'pending',
        deliveryStatus: o.order_status || 'placed',
        delivery_address: [o.delivery_house, o.delivery_street, o.delivery_area, o.delivery_city, o.delivery_state, o.delivery_pincode].filter(Boolean).join(', '),
        createdAt: o.created_at,
        items: o.items || [],
        payments: o.payments || [],
        delivery: o.delivery,
        invoice: o.invoice
      };
    }
  } catch (err) {}
  return null;
};

export const updateOrderStatus = async (id, { deliveryStatus, paymentStatus }) => {
  // Try Firestore
  try {
    const docRef = doc(db, 'orders', String(id));
    const payload = { updatedAt: new Date().toISOString() };
    if (deliveryStatus !== undefined) {
      payload.deliveryStatus = deliveryStatus;
      payload.order_status = deliveryStatus;
    }
    if (paymentStatus !== undefined) {
      payload.paymentStatus = paymentStatus;
      payload.payment_status = paymentStatus;
    }
    await updateDoc(docRef, payload);
  } catch (fsErr) {
    console.warn('Firestore updateOrderStatus fallback:', fsErr.message);
  }

  // Also sync to SQLite Backend API
  try {
    if (deliveryStatus !== undefined) {
      await api.put(`/orders/admin/${id}/status`, { order_status: deliveryStatus });
    }
  } catch (apiErr) {
    // silent
  }
};

// ==========================================
// PAYMENTS API (Firestore + SQLite Backend Dual Mode)
// ==========================================
export const recordPayment = async ({
  orderId,
  customerId,
  amount,
  paymentMethod = 'cash',
  paymentStatus = 'paid',
  notes = ''
}) => {
  const amt = Number(amount);
  if (isNaN(amt) || amt <= 0) throw new Error('Payment amount must be greater than 0');
  const now = new Date().toISOString();

  // Try Firestore
  try {
    let orderNumber = '';
    if (orderId) {
      const orderDoc = await getOrderById(orderId);
      orderNumber = orderDoc?.orderNumber || orderDoc?.order_number || '';
    }

    const paymentsRef = collection(db, 'payments');
    const paymentData = {
      orderId: String(orderId),
      order_id: String(orderId),
      order_number: orderNumber,
      customerId: customerId || '',
      amount: amt,
      paymentMethod,
      method: paymentMethod,
      paymentStatus,
      paymentDate: now,
      payment_date: now,
      createdAt: now,
      notes
    };

    const paymentDocRef = await addDoc(paymentsRef, paymentData);

    if (orderId) {
      try {
        await updateDoc(doc(db, 'orders', String(orderId)), {
          paymentStatus: 'paid',
          payment_status: 'paid',
          updatedAt: now
        });
      } catch (e) {}
    }
    return paymentDocRef.id;
  } catch (fsErr) {
    console.warn('Firestore recordPayment fallback to SQLite API:', fsErr.message);
  }

  // Fallback to SQLite Backend API
  try {
    const res = await api.post('/payments', {
      order_id: Number(orderId) || orderId,
      amount: amt,
      method: paymentMethod,
      notes
    });
    return String(res.data?.id || Date.now());
  } catch (apiErr) {
    console.error('API recordPayment error:', apiErr);
    throw apiErr;
  }
};

export const getPayments = async () => {
  // 1. Try SQLite Backend API
  let apiPayments = [];
  try {
    const res = await api.get('/payments');
    apiPayments = (res.data || []).map(p => ({
      id: String(p.id),
      orderId: String(p.order_id),
      order_id: String(p.order_id),
      orderNumber: p.order_number,
      order_number: p.order_number,
      customerName: p.customer_name || 'Customer',
      amount: Number(p.amount || 0),
      paymentMethod: p.method || 'cash',
      method: p.method || 'cash',
      paymentStatus: p.payment_status || 'paid',
      paymentDate: p.created_at,
      payment_date: p.created_at,
      createdAt: p.created_at,
      notes: p.notes || ''
    }));
  } catch (e) {
    console.warn('API payments error:', e.message);
  }

  // 2. Try Firestore
  let fsPayments = [];
  try {
    const paymentsRef = collection(db, 'payments');
    const snapshot = await getDocs(paymentsRef);
    fsPayments = snapshot.docs.map(formatDoc);
  } catch (e) {
    console.warn('Firestore payments unavailable:', e.message);
  }

  const seen = new Set();
  const merged = [];
  for (const p of [...apiPayments, ...fsPayments]) {
    const key = p.id;
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(p);
    }
  }

  return merged.sort((a, b) => new Date(b.paymentDate || b.createdAt || 0) - new Date(a.paymentDate || a.createdAt || 0));
};

export const getPaymentsByOrder = async (orderId) => {
  const payments = await getPayments();
  return payments.filter(p => String(p.orderId) === String(orderId) || String(p.order_id) === String(orderId));
};

// ==========================================
// INVENTORY API (Firestore + SQLite Backend Dual Mode)
// ==========================================
export const updateProductStock = async (productId, newStockQuantity) => {
  const stock = Number(newStockQuantity);
  if (isNaN(stock) || stock < 0) throw new Error('Stock quantity cannot be negative');

  try {
    const productRef = doc(db, 'products', String(productId));
    await updateDoc(productRef, {
      stockQuantity: stock,
      stock,
      updatedAt: new Date().toISOString()
    });
  } catch (e) {}

  try {
    await api.put(`/products/${productId}`, { stock });
  } catch (e) {}
};

export const addStock = async (productId, addedQuantity) => {
  const qty = Number(addedQuantity);
  if (isNaN(qty) || qty <= 0) throw new Error('Quantity must be greater than 0');

  // Try Firestore
  try {
    return await runTransaction(db, async (transaction) => {
      const productRef = doc(db, 'products', String(productId));
      const productSnap = await transaction.get(productRef);
      if (productSnap.exists()) {
        const currentStock = Number(productSnap.data().stockQuantity || productSnap.data().stock || 0);
        const newStock = currentStock + qty;
        transaction.update(productRef, {
          stockQuantity: newStock,
          stock: newStock,
          updatedAt: new Date().toISOString()
        });
        return newStock;
      }
    });
  } catch (e) {}

  // Fallback to SQLite Backend API
  try {
    const res = await api.post('/inventory/add', {
      product_id: Number(productId) || productId,
      quantity: qty,
      notes: 'Admin stock add'
    });
    return res.data?.new_stock;
  } catch (apiErr) {
    console.error('Add stock API error:', apiErr);
    throw apiErr;
  }
};

// ==========================================
// DASHBOARD METRICS API (Firestore + SQLite Backend Dual Mode)
// ==========================================
export const getDashboardStats = async () => {
  // 1. Fetch summary metrics from backend report API
  let statsData = null;
  try {
    const res = await api.get('/reports/dashboard');
    if (res.data) statsData = res.data;
  } catch (e) {
    console.warn('Backend report dashboard stats fallback:', e.message);
  }

  // 2. Fetch parallel items safely with fallback
  const [customers, orders, payments, products] = await Promise.all([
    getCustomers().catch(() => []),
    getOrders().catch(() => []),
    getPayments().catch(() => []),
    getProducts().catch(() => [])
  ]);

  const totalCustomers = statsData?.total_customers ?? customers.length;
  const totalOrders = statsData?.total_orders ?? orders.length;
  const totalSales = statsData?.total_sales ?? orders.reduce((sum, o) => sum + (Number(o.totalAmount || o.total) || 0), 0);
  const totalPaid = statsData?.total_received ?? payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingPayments = statsData?.pending_payments ?? Math.max(0, totalSales - totalPaid);

  const wirecutProduct = products.find(p => p.name?.toLowerCase().includes('wirecut')) || products[0];
  const tableMouldProduct = products.find(p =>
    p.name?.toLowerCase().includes('table mould') || p.name?.toLowerCase().includes('table_mould')
  ) || products[1];

  const wirecutStock = wirecutProduct ? (Number(wirecutProduct.stockQuantity || wirecutProduct.stock) || 0) : 0;
  const tableMouldStock = tableMouldProduct ? (Number(tableMouldProduct.stockQuantity || tableMouldProduct.stock) || 0) : 0;
  const recentOrders = orders.slice(0, 5);

  return {
    totalCustomers,
    totalOrders,
    totalSales,
    pendingPayments,
    wirecutStock,
    tableMouldStock,
    recentOrders,
    products
  };
};
