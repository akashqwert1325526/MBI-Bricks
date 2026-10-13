import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, DollarSign, Truck, MapPin, ExternalLink, MessageCircle, Navigation, X } from 'lucide-react';
import { LoadingPage } from '../components/utils';
import api from '../api';
import {
  getOrderById,
  getPaymentsByOrder,
  recordPayment,
  updateOrderStatus
} from '../services/firebaseService';
import toast from 'react-hot-toast';

const DELIVERY_STATUSES = ['placed', 'confirmed', 'dispatched', 'delivered', 'cancelled'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState('');
  const [payForm, setPayForm] = useState({ amount: '', method: 'cash', notes: '' });
  const [showPay, setShowPay] = useState(false);

  // Dispatch modal state
  const [showDispatch, setShowDispatch] = useState(false);
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
      let orderData = null;
      let payList = [];

      // Try Firestore first
      try {
        orderData = await getOrderById(id);
        if (orderData) {
          payList = await getPaymentsByOrder(id);
        }
      } catch (e) {
        console.warn('Firestore getOrder error:', e);
      }

      // If not in Firestore or numeric ID, fetch from SQLite API
      if (!orderData) {
        try {
          const res = await api.get(`/orders/admin/${id}`);
          const o = res.data;
          orderData = {
            id: String(o.id),
            orderNumber: o.order_number,
            order_number: o.order_number,
            customerId: String(o.user_id),
            customerName: o.customer_name || 'Customer',
            customerPhone: o.customer_phone || '',
            productName: o.items?.[0]?.product_name || 'Bricks',
            quantity: o.items?.reduce((s, i) => s + i.quantity, 0) || 0,
            totalAmount: o.total,
            total: o.total,
            subtotal: o.subtotal,
            deliveryCharge: o.delivery_charge,
            paymentStatus: o.payment_status || 'pending',
            deliveryStatus: o.order_status || 'placed',
            delivery_lat: o.delivery_lat,
            delivery_lng: o.delivery_lng,
            delivery_location_label: o.delivery_location_label,
            delivery_distance_km: o.delivery_distance_km,
            delivery_address: [o.delivery_house, o.delivery_street, o.delivery_area, o.delivery_city, o.delivery_state, o.delivery_pincode].filter(Boolean).join(', '),
            items: o.items || [],
            delivery: o.delivery,
            orderDate: o.created_at,
            createdAt: o.created_at
          };
          payList = (o.payments || []).map(p => ({
            id: String(p.id),
            amount: p.amount,
            paymentMethod: p.method,
            paymentDate: p.created_at,
            notes: p.notes
          }));
        } catch (apiErr) {
          console.error('API getOrder error:', apiErr);
        }
      }

      if (!orderData) {
        toast.error('Order not found');
        navigate('/admin/orders');
        return;
      }

      setOrder(orderData);
      setPayments(payList);
      setNewStatus(orderData.deliveryStatus || orderData.order_status || 'placed');
    } catch (err) {
      console.error(err);
      toast.error('Error fetching order details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleUpdateStatus = async () => {
    try {
      try {
        await api.put(`/orders/admin/${id}/status`, { order_status: newStatus });
      } catch {}
      try {
        await updateOrderStatus(id, { deliveryStatus: newStatus });
      } catch {}
      toast.success('Delivery status updated!');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status');
    }
  };

  const handleRecordPayment = async () => {
    if (!payForm.amount || Number(payForm.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    try {
      await recordPayment({
        orderId: id,
        customerId: order.customerId,
        amount: payForm.amount,
        paymentMethod: payForm.method,
        notes: payForm.notes
      });
      toast.success('Payment recorded!');
      setShowPay(false);
      setPayForm({ amount: '', method: 'cash', notes: '' });
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error recording payment');
    }
  };

  const handleDispatch = async (e) => {
    e.preventDefault();
    if (!dispatchForm.driver_name || !dispatchForm.vehicle) {
      toast.error('Driver name and vehicle number required');
      return;
    }
    setDispatching(true);
    try {
      try {
        await api.post('/deliveries', {
          order_id: id,
          driver_name: dispatchForm.driver_name,
          vehicle: dispatchForm.vehicle,
          expected_date: dispatchForm.expected_date,
          notes: `${dispatchForm.notes || ''} (Driver Ph: ${dispatchForm.driver_phone || ''})`
        });
      } catch {}

      try {
        await api.put(`/orders/admin/${id}/status`, { order_status: 'dispatched' });
      } catch {}
      try {
        await updateOrderStatus(id, { deliveryStatus: 'dispatched' });
      } catch {}

      toast.success('🚚 Order dispatched!');
      setShowDispatch(false);
      loadData();
    } catch {
      toast.error('Failed to dispatch');
    } finally {
      setDispatching(false);
    }
  };

  const sendCustomerWhatsApp = () => {
    const phone = (order?.customerPhone || '').replace(/[^0-9]/g, '');
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const mapsLink = (order?.delivery_lat && order?.delivery_lng)
      ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`
      : '';
    const text = `🧱 *MBI Bricks Industries — Order Dispatched*\n\nHello *${order?.customerName || 'Customer'}*,\nYour brick order *#${order?.orderNumber || order?.order_number}* has been dispatched!\n\n🚛 *Vehicle Number:* ${dispatchForm.vehicle || order?.delivery?.vehicle || 'Truck Assigned'}\n👨‍✈️ *Driver:* ${dispatchForm.driver_name || order?.delivery?.driver_name || 'Driver'}${dispatchForm.driver_phone ? ` (${dispatchForm.driver_phone})` : ''}\n📦 *Status:* In Transit\n${mapsLink ? `📍 *Location Pin:* ${mapsLink}\n` : ''}\nThank you for choosing MBI Bricks!`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="admin-page"><LoadingPage /></div>;
  if (!order) return null;

  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = Math.max(0, (order.totalAmount || order.total || 0) - totalPaid);
  const hasGps = order.delivery_lat && order.delivery_lng;
  const mapsUrl = hasGps ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}` : null;
  const isDispatched = ['dispatched', 'out_for_delivery', 'delivered'].includes(order.deliveryStatus || order.order_status);

  return (
    <div className="admin-page">
      <Link to="/admin/orders" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
        <ChevronLeft size={18} /> Back to Orders
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: 4 }}>
            Order #{order.orderNumber || order.order_number || order.id.slice(0, 8)}
          </h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className={`tag ${isDispatched ? 'tag-delivered' : 'tag-confirmed'}`}>
              Status: {(order.deliveryStatus || order.order_status || 'placed').toUpperCase()}
            </span>
            <span className={`tag ${order.paymentStatus === 'paid' ? 'tag-delivered' : order.paymentStatus === 'partial' ? 'tag-confirmed' : 'tag-cancelled'}`}>
              Payment: {order.paymentStatus?.toUpperCase()}
            </span>
            {order.delivery_distance_km && (
              <span className="badge badge-primary" style={{ fontSize: 12 }}>
                📏 {order.delivery_distance_km} km from factory
              </span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {!isDispatched ? (
            <button className="btn btn-primary btn-sm" onClick={() => setShowDispatch(true)}>
              <Truck size={14} /> Dispatch Bricks
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" style={{ color: '#22c55e', borderColor: '#22c55e' }} onClick={sendCustomerWhatsApp}>
              <MessageCircle size={14} /> WhatsApp Customer
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowPay(!showPay)}>
            <DollarSign size={14} /> Record Payment
          </button>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatch && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 className="modal-title">🚚 Dispatch Order #{order.orderNumber || order.order_number}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowDispatch(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleDispatch}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group">
                  <label className="form-label">Vehicle / Truck Number *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. KA 06 B 1234 (10-Ton Truck)"
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
              </div>
              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowDispatch(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={dispatching}>
                  {dispatching ? 'Dispatching...' : 'Confirm Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Form */}
      {showPay && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header"><h3 className="modal-title">Record Payment for Order</h3></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Payment Amount (₹)</label>
                <input
                  className="form-input"
                  type="number"
                  value={payForm.amount}
                  onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder={remaining > 0 ? `Remaining: ₹${remaining.toLocaleString('en-IN')}` : 'Amount'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Payment Method</label>
                <select
                  className="form-input form-select"
                  value={payForm.method}
                  onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                >
                  <option value="cash">Cash</option>
                  <option value="upi">UPI</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input
                  className="form-input"
                  value={payForm.notes}
                  onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Payment reference"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button className="btn btn-primary btn-sm" onClick={handleRecordPayment}>Save Payment</button>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowPay(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Order Items */}
          <div className="card">
            <div className="card-header"><h3 className="modal-title">Order Items</h3></div>
            <div style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Price / Brick</th><th>Total</th></tr>
                </thead>
                <tbody>
                  {order.items && order.items.length > 0 ? (
                    order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 700 }}>{it.product_name || it.name || 'Brick'}</td>
                        <td>{(it.quantity || 0).toLocaleString('en-IN')} pcs</td>
                        <td>₹{Number(it.price || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                          ₹{(it.subtotal || it.quantity * it.price || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td style={{ fontWeight: 700 }}>{order.productName || 'Brick Product'}</td>
                      <td>{(order.quantity || 0).toLocaleString('en-IN')} pcs</td>
                      <td>₹{Number(order.pricePerBrick || 0).toFixed(2)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent)' }}>
                        ₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="card">
            <div className="card-header"><h3 className="modal-title">Payment History</h3></div>
            <div style={{ overflow: 'hidden' }}>
              {payments.length ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr><th>Amount</th><th>Method</th><th>Date</th><th>Notes</th></tr>
                  </thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ₹{(p.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td>{p.paymentMethod?.toUpperCase()}</td>
                        <td style={{ fontSize: 13 }}>
                          {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{p.notes || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ padding: 20, color: 'var(--text-muted)' }}>No payment records found for this order.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Customer & Location */}
          <div className="card">
            <div className="card-header"><h3 className="modal-title">Customer & Delivery Info</h3></div>
            <div className="card-body">
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{order.customerName || 'Customer'}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>
                📞 {order.customerPhone || 'N/A'}
              </div>

              {order.delivery_address && (
                <div style={{ marginBottom: 12, fontSize: 13, color: 'var(--text-secondary)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>Address</div>
                  {order.delivery_address}
                </div>
              )}

              {/* 📍 GPS Location Block */}
              {hasGps && (
                <div style={{ background: 'rgba(14,165,233,0.08)', padding: 12, borderRadius: 8, border: '1px solid rgba(14,165,233,0.25)', marginTop: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#0ea5e9', marginBottom: 4 }}>
                    <MapPin size={16} /> Shared GPS Location
                  </div>
                  {order.delivery_location_label && (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                      {order.delivery_location_label}
                    </div>
                  )}
                  {order.delivery_distance_km && (
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, marginBottom: 8 }}>
                      Distance: {order.delivery_distance_km} km
                    </div>
                  )}
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <ExternalLink size={14} /> Navigate on Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
            <div className="cart-summary-row">
              <span>Order Date</span>
              <span>{order.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : '—'}</span>
            </div>
            {order.deliveryCharge > 0 && (
              <div className="cart-summary-row">
                <span>Delivery Charge</span>
                <span>₹{Number(order.deliveryCharge).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="cart-summary-row">
              <strong style={{ fontSize: 18 }}>Total Amount</strong>
              <span className="cart-summary-total">₹{(order.totalAmount || order.total || 0).toLocaleString('en-IN')}</span>
            </div>
            <hr className="divider" />
            <div style={{ fontSize: 14 }}>
              <div className="cart-summary-row">
                <span style={{ color: 'var(--success)' }}>Total Paid</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>₹{totalPaid.toLocaleString('en-IN')}</span>
              </div>
              {remaining > 0 && (
                <div className="cart-summary-row">
                  <span style={{ color: 'var(--error)' }}>Balance Remaining</span>
                  <span style={{ color: 'var(--error)', fontWeight: 700 }}>₹{remaining.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Update */}
          <div className="card">
            <div className="card-body">
              <label className="form-label" style={{ marginBottom: 8 }}>Update Delivery Status</label>
              <select
                className="form-input form-select"
                value={newStatus}
                onChange={e => setNewStatus(e.target.value)}
                style={{ marginBottom: 12 }}
              >
                {DELIVERY_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleUpdateStatus}>
                Update Delivery Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
