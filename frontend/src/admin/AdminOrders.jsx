import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Eye, ChevronDown, X, ShoppingBag, Truck, MapPin, ExternalLink, MessageCircle, Phone, Navigation } from 'lucide-react';
import { LoadingPage } from '../components/utils';
import api from '../api';
import {
  getOrders as getFirestoreOrders,
  getCustomers,
  getProducts,
  createOrderWithStockTransaction,
  updateOrderStatus
} from '../services/firebaseService';
import toast from 'react-hot-toast';

const DELIVERY_STATUSES = ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'partial', 'paid'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  // Create Order Modal State
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    customerId: '',
    productId: '',
    quantity: '',
    paymentStatus: 'pending',
    deliveryStatus: 'placed',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  // Dispatch Modal State
  const [dispatchModal, setDispatchModal] = useState(false);
  const [activeDispatchOrder, setActiveDispatchOrder] = useState(null);
  const [dispatchForm, setDispatchForm] = useState({
    driver_name: '',
    driver_phone: '',
    vehicle: '',
    expected_date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [dispatching, setDispatching] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from SQLite backend
      let apiOrders = [];
      try {
        const res = await api.get('/orders/admin/all?limit=100');
        apiOrders = (res.data.orders || []).map(o => ({
          id: String(o.id),
          orderNumber: o.order_number,
          order_number: o.order_number,
          customerId: String(o.user_id),
          customerName: o.customer_name || 'Customer',
          customerPhone: o.customer_phone || '',
          productName: o.items_summary || 'Bricks',
          quantity: 0,
          totalAmount: o.total,
          subtotal: o.subtotal,
          deliveryCharge: o.delivery_charge,
          paymentStatus: o.payment_status || 'pending',
          deliveryStatus: o.order_status || 'placed',
          order_status: o.order_status || 'placed',
          delivery_lat: o.delivery_lat,
          delivery_lng: o.delivery_lng,
          delivery_location_label: o.delivery_location_label,
          delivery_distance_km: o.delivery_distance_km,
          delivery_address: [o.delivery_house, o.delivery_street, o.delivery_area, o.delivery_city, o.delivery_state, o.delivery_pincode].filter(Boolean).join(', '),
          createdAt: o.created_at,
          source: 'api'
        }));
      } catch (e) {
        console.warn('API orders error:', e);
      }

      // 2. Fetch from Firestore
      let fsOrders = [];
      try {
        fsOrders = await getFirestoreOrders();
      } catch (e) {
        console.warn('Firestore orders error:', e);
      }

      // Merge and deduplicate by orderNumber or id
      const seen = new Set();
      const merged = [];

      for (const o of [...apiOrders, ...fsOrders]) {
        const key = o.orderNumber || o.order_number || o.id;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(o);
        }
      }

      // Sort by newest first
      merged.sort((a, b) => new Date(b.createdAt || b.orderDate || 0) - new Date(a.createdAt || a.orderDate || 0));

      setOrders(merged);

      // Fetch customers & products for creation modal
      const [customerList, productList] = await Promise.all([
        getCustomers().catch(() => []),
        getProducts().catch(() => [])
      ]);
      setCustomers(customerList);
      setProducts(productList);

      if (customerList.length > 0 && !form.customerId) {
        setForm(f => ({ ...f, customerId: customerList[0].id }));
      }
      if (productList.length > 0 && !form.productId) {
        setForm(f => ({ ...f, productId: productList[0].id }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedProduct = products.find(p => p.id === form.productId);
  const pricePerBrick = selectedProduct ? (selectedProduct.pricePerBrick || selectedProduct.price || 0) : 0;
  const currentStock = selectedProduct ? (selectedProduct.stockQuantity || selectedProduct.stock || 0) : 0;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!form.customerId) { toast.error('Please select a customer'); return; }
    if (!form.productId) { toast.error('Please select a brick product'); return; }
    const qty = Number(form.quantity);
    if (!qty || qty <= 0) { toast.error('Please enter a valid quantity'); return; }
    if (qty > currentStock) {
      toast.error(`Cannot order ${qty} bricks. Available stock is ${currentStock} pieces.`);
      return;
    }

    setSaving(true);
    try {
      await createOrderWithStockTransaction({
        customerId: form.customerId,
        productId: form.productId,
        quantity: qty,
        pricePerBrick: pricePerBrick,
        paymentStatus: form.paymentStatus,
        deliveryStatus: form.deliveryStatus,
        notes: form.notes
      });

      toast.success('Order created & inventory stock updated cleanly in Firestore!');
      setModal(false);
      setForm(f => ({ ...f, quantity: '', notes: '' }));
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Transaction failed while creating order');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (orderId, newDeliveryStatus) => {
    try {
      // Update via API
      try {
        await api.put(`/orders/admin/${orderId}/status`, { order_status: newDeliveryStatus });
      } catch {}
      // Update via Firestore
      try {
        await updateOrderStatus(orderId, { deliveryStatus: newDeliveryStatus });
      } catch {}

      toast.success(`Delivery status updated to ${newDeliveryStatus}`);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  // Open Dispatch Modal
  const openDispatch = (order) => {
    setActiveDispatchOrder(order);
    setDispatchForm({
      driver_name: '',
      driver_phone: '',
      vehicle: '',
      expected_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setDispatchModal(true);
  };

  // Handle Dispatch Bricks
  const handleDispatchSubmit = async (e) => {
    e.preventDefault();
    if (!dispatchForm.driver_name) { toast.error('Please enter driver name'); return; }
    if (!dispatchForm.vehicle) { toast.error('Please enter vehicle / truck number'); return; }

    setDispatching(true);
    try {
      const orderId = activeDispatchOrder.id;

      // 1. Post to API deliveries
      try {
        await api.post('/deliveries', {
          order_id: orderId,
          driver_name: dispatchForm.driver_name,
          vehicle: dispatchForm.vehicle,
          expected_date: dispatchForm.expected_date,
          notes: `${dispatchForm.notes || ''} (Driver Ph: ${dispatchForm.driver_phone || ''})`
        });
      } catch (err) {
        console.warn('API delivery error:', err);
      }

      // 2. Update status to dispatched
      try {
        await api.put(`/orders/admin/${orderId}/status`, { order_status: 'dispatched' });
      } catch {}
      try {
        await updateOrderStatus(orderId, { deliveryStatus: 'dispatched' });
      } catch {}

      toast.success(`🚚 Bricks Dispatched successfully for Order #${activeDispatchOrder.orderNumber || activeDispatchOrder.order_number}!`);
      setDispatchModal(false);
      loadData();
    } catch (err) {
      toast.error('Failed to dispatch order');
    } finally {
      setDispatching(false);
    }
  };

  // Send WhatsApp notification to Customer
  const sendCustomerWhatsApp = (order) => {
    const phone = (order.customerPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const mapsLink = (order.delivery_lat && order.delivery_lng)
      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`
      : '';
    const text = `🧱 *MBI Bricks Industries — Order Dispatched*\n\nHello *${order.customerName || 'Customer'}*,\nYour brick order *#${order.orderNumber || order.order_number}* has been dispatched!\n\n🚛 *Vehicle Number:* ${dispatchForm.vehicle || 'Assigned Truck'}\n👨‍✈️ *Driver:* ${dispatchForm.driver_name || 'Driver'}${dispatchForm.driver_phone ? ` (${dispatchForm.driver_phone})` : ''}\n📦 *Status:* In Transit\n${mapsLink ? `📍 *Delivery Location:* ${mapsLink}\n` : ''}\nThank you for choosing MBI Bricks!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Send WhatsApp message to Driver
  const sendDriverWhatsApp = (order) => {
    const phone = (dispatchForm.driver_phone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const mapsLink = (order.delivery_lat && order.delivery_lng)
      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`
      : '';
    const text = `🚚 *MBI Bricks — Delivery Assignment*\n\nOrder: *#${order.orderNumber || order.order_number}*\nCustomer: *${order.customerName || 'Customer'}* (${order.customerPhone || 'N/A'})\nAddress: ${order.delivery_address || 'Delivery Address'}\n${mapsLink ? `📍 *Navigation Map:* ${mapsLink}\n` : ''}Truck: ${dispatchForm.vehicle}\nPlease confirm once delivered safely.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const filteredOrders = orders.filter(o => {
    const currentStatus = o.deliveryStatus || o.order_status || 'placed';
    const matchStatus = !filter || currentStatus === filter || o.paymentStatus === filter;
    const q = search.toLowerCase();
    const matchSearch = !search ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.order_number?.toLowerCase().includes(q) ||
      o.customerName?.toLowerCase().includes(q) ||
      o.productName?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="admin-page-title">Orders & Dispatch</h1>
          <p className="admin-page-subtitle">Track customer orders, live GPS delivery locations & dispatch bricks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}>
          <Plus size={16} /> Create Order
        </button>
      </div>

      {/* Search & Status Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="search-bar" style={{ flex: 1, minWidth: 240, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', padding: '8px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none' }}
            placeholder="Search order #, customer, product..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button className={`chip ${filter === '' ? 'active' : ''}`} onClick={() => setFilter('')}>All</button>
          {DELIVERY_STATUSES.map(s => (
            <button key={s} className={`chip ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {loading ? <LoadingPage /> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Details / Items</th>
                <th>Location / Distance</th>
                <th>Total</th>
                <th>Status</th>
                <th>Dispatch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const currentStatus = order.deliveryStatus || order.order_status || 'placed';
                  const isDispatched = currentStatus === 'dispatched' || currentStatus === 'out_for_delivery' || currentStatus === 'delivered';
                  const hasGps = order.delivery_lat && order.delivery_lng;
                  const mapsUrl = hasGps ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}` : null;

                  return (
                    <tr key={order.id}>
                      <td>
                        <Link to={`/admin/orders/${order.id}`} style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {order.orderNumber || order.order_number || order.id.slice(0, 8)}
                        </Link>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {new Date(order.createdAt || order.orderDate || Date.now()).toLocaleDateString('en-IN')}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName || 'Customer'}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.customerPhone || '—'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{order.productName || 'Bricks'}</div>
                        {order.quantity > 0 && (
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {order.quantity.toLocaleString('en-IN')} pcs
                          </div>
                        )}
                      </td>
                      <td>
                        {hasGps ? (
                          <div>
                            <a
                              href={mapsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-secondary btn-sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', fontSize: 11 }}
                              title="Open customer GPS location on Google Maps"
                            >
                              <MapPin size={12} color="#0ea5e9" /> GPS Pin <ExternalLink size={10} />
                            </a>
                            {order.delivery_distance_km && (
                              <div style={{ fontSize: 11, color: '#0ea5e9', marginTop: 4, fontWeight: 600 }}>
                                📏 {order.delivery_distance_km} km away
                              </div>
                            )}
                          </div>
                        ) : order.delivery_address ? (
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', maxWidth: 160 }} title={order.delivery_address}>
                            {order.delivery_address.slice(0, 35)}...
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Standard</span>
                        )}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--accent)' }}>
                          ₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                        </strong>
                        {order.deliveryCharge > 0 && (
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            + ₹{order.deliveryCharge} delivery
                          </div>
                        )}
                      </td>
                      <td>
                        <select
                          className="form-input form-select"
                          style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}
                          value={currentStatus}
                          onChange={e => handleStatusChange(order.id, e.target.value)}
                        >
                          {DELIVERY_STATUSES.map(s => (
                            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {isDispatched ? (
                          <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                            <Truck size={12} /> Dispatched
                          </span>
                        ) : (
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '5px 10px', fontSize: 12 }}
                            onClick={() => openDispatch(order)}
                          >
                            <Truck size={13} /> Dispatch Bricks
                          </button>
                        )}
                      </td>
                      <td>
                        <Link to={`/admin/orders/${order.id}`} className="btn btn-secondary btn-sm">
                          <Eye size={13} /> View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 🚚 Dispatch Bricks Modal */}
      {dispatchModal && activeDispatchOrder && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={20} color="var(--primary)" />
                <h3 className="modal-title">
                  Dispatch Order #{activeDispatchOrder.orderNumber || activeDispatchOrder.order_number}
                </h3>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setDispatchModal(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Order Summary banner */}
                <div style={{ background: 'var(--surface-2)', padding: 12, borderRadius: 8, fontSize: 13, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Customer:</span>
                    <strong>{activeDispatchOrder.customerName} ({activeDispatchOrder.customerPhone || 'N/A'})</strong>
                  </div>
                  {activeDispatchOrder.delivery_distance_km && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Distance:</span>
                      <strong style={{ color: '#0ea5e9' }}>{activeDispatchOrder.delivery_distance_km} km from factory</strong>
                    </div>
                  )}
                  {activeDispatchOrder.delivery_lat && activeDispatchOrder.delivery_lng && (
                    <div style={{ marginTop: 6 }}>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${activeDispatchOrder.delivery_lat},${activeDispatchOrder.delivery_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0ea5e9', fontSize: 12, fontWeight: 600 }}
                      >
                        <MapPin size={13} /> Open Delivery Pin on Google Maps <ExternalLink size={11} />
                      </a>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Vehicle / Truck Number *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. KA 06 B 4521 (10-Ton Truck)"
                    value={dispatchForm.vehicle}
                    onChange={e => setDispatchForm(f => ({ ...f, vehicle: e.target.value }))}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Driver Name *</label>
                    <input
                      className="form-input"
                      placeholder="e.g. Ramesh"
                      value={dispatchForm.driver_name}
                      onChange={e => setDispatchForm(f => ({ ...f, driver_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Driver Phone</label>
                    <input
                      className="form-input"
                      placeholder="e.g. 9876543210"
                      value={dispatchForm.driver_phone}
                      onChange={e => setDispatchForm(f => ({ ...f, driver_phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Delivery Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dispatchForm.expected_date}
                    onChange={e => setDispatchForm(f => ({ ...f, expected_date: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dispatch Notes</label>
                  <input
                    className="form-input"
                    placeholder="Special instructions or gate notes..."
                    value={dispatchForm.notes}
                    onChange={e => setDispatchForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>

                {/* WhatsApp Quick Actions */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                  <label className="form-label" style={{ marginBottom: 8 }}>Instant WhatsApp Notifications</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#22c55e', borderColor: '#22c55e' }}
                      onClick={() => sendCustomerWhatsApp(activeDispatchOrder)}
                    >
                      <MessageCircle size={14} /> Send WhatsApp to Customer
                    </button>
                    {dispatchForm.driver_phone && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#0ea5e9', borderColor: '#0ea5e9' }}
                        onClick={() => sendDriverWhatsApp(activeDispatchOrder)}
                      >
                        <Navigation size={14} /> Send Map & Route to Driver
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setDispatchModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={dispatching}>
                  {dispatching ? 'Dispatching...' : '🚚 Confirm & Dispatch Bricks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">Create New Brick Order</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreateOrder}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Select Customer *</label>
                  {customers.length === 0 ? (
                    <div style={{ color: 'var(--warning)', fontSize: 13 }}>
                      No customers found. Please add a customer first in the Customers section!
                    </div>
                  ) : (
                    <select
                      className="form-input form-select"
                      value={form.customerId}
                      onChange={e => setForm(f => ({ ...f, customerId: e.target.value }))}
                      required
                    >
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name || c.full_name} ({c.phone || c.city || 'No phone'})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Select Brick Type *</label>
                  <select
                    className="form-input form-select"
                    value={form.productId}
                    onChange={e => setForm(f => ({ ...f, productId: e.target.value }))}
                    required
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} — ₹{p.pricePerBrick || p.price || 0}/brick (Stock: {(p.stockQuantity || p.stock || 0).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Quantity (Pieces) *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 5000"
                      value={form.quantity}
                      onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                      min="1"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Calculated Total</label>
                    <div style={{ padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', fontWeight: 800, color: 'var(--primary)', fontSize: 18 }}>
                      ₹{((Number(form.quantity) || 0) * pricePerBrick).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Payment Status</label>
                    <select
                      className="form-input form-select"
                      value={form.paymentStatus}
                      onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}
                    >
                      {PAYMENT_STATUSES.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Delivery Status</label>
                    <select
                      className="form-input form-select"
                      value={form.deliveryStatus}
                      onChange={e => setForm(f => ({ ...f, deliveryStatus: e.target.value }))}
                    >
                      {DELIVERY_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea
                    className="form-input"
                    rows="2"
                    placeholder="Delivery instructions, site location..."
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating Order...' : 'Create Order & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
