import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, RefreshCw, FileText, MapPin, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import { LoadingPage, OrderStatusTag, PaymentStatusTag, formatDate } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

const ORDER_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: '📋' },
  { key: 'confirmed', label: 'Confirmed', icon: '✅' },
  { key: 'preparing', label: 'Preparing', icon: '🏭' },
  { key: 'dispatched', label: 'Dispatched', icon: '📦' },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: '🚛' },
  { key: 'delivered', label: 'Delivered', icon: '🏠' },
];

const STATUS_ORDER = ['placed', 'confirmed', 'preparing', 'dispatched', 'out_for_delivery', 'delivered'];

export default function OrderDetailPage() {
  const { id } = useParams();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/my/${id}`).then(r => setOrder(r.data)).catch(() => navigate('/orders')).finally(() => setLoading(false));
  }, [id]);

  const handleReorder = async () => {
    try {
      const r = await api.post(`/orders/reorder/${id}`);
      toast.success('Items added to cart!');
      if (r.data.errors?.length) r.data.errors.forEach(e => toast.error(e));
      navigate('/cart');
    } catch { toast.error('Failed to reorder'); }
  };

  if (loading) return <div className="page"><LoadingPage /></div>;
  if (!order) return null;

  const currentStatusIdx = order.order_status === 'cancelled' ? -1 : STATUS_ORDER.indexOf(order.order_status);

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <Link to="/orders" className="back-link"><ChevronLeft size={18} /> {t(lang, 'myOrders')}</Link>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--primary)', marginBottom: 4 }}>{order.order_number}</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Placed on {formatDate(order.created_at)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {order.order_status === 'delivered' && (
              <button className="btn btn-accent btn-sm" onClick={handleReorder}><RefreshCw size={14} /> {t(lang, 'buyAgain')}</button>
            )}
            {order.invoice && (
              <Link to={`/orders/${id}`} className="btn btn-secondary btn-sm"><FileText size={14} /> Invoice</Link>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Order Tracking */}
            <div className="card" id="track">
              <div className="card-header">
                <h3 className="modal-title">{t(lang, 'trackOrder')}</h3>
                <OrderStatusTag status={order.order_status} />
              </div>
              <div className="card-body">
                {order.order_status === 'cancelled' ? (
                  <div className="alert alert-error"><span>✗</span><span>This order has been cancelled.</span></div>
                ) : (
                  <div className="order-timeline">
                    {ORDER_STEPS.map((step, i) => {
                      const done = i < currentStatusIdx;
                      const current = i === currentStatusIdx;
                      const upcoming = i > currentStatusIdx;
                      return (
                        <div key={step.key} className={`timeline-item ${done ? 'done' : current ? 'current' : ''}`}>
                          <div className="timeline-dot">
                            {done ? '✓' : current ? step.icon : '○'}
                          </div>
                          <div className="timeline-content">
                            <div className="timeline-title" style={{ color: upcoming ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                              {step.label}
                            </div>
                            {current && <div className="timeline-date">Current Status</div>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div className="card">
              <div className="card-header"><h3 className="modal-title">{t(lang, 'orderItems')}</h3></div>
              <div className="card-body" style={{ padding: 0 }}>
                {order.items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🧱</div>
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.product_name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.quantity?.toLocaleString('en-IN')} × ₹{item.price}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>₹{item.subtotal?.toLocaleString('en-IN')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery */}
            {order.delivery && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'delivery')}</h3></div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {order.delivery.driver_name && <div><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Driver</p><p style={{ fontWeight: 600 }}>{order.delivery.driver_name}</p></div>}
                    {order.delivery.vehicle && <div><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Vehicle</p><p style={{ fontWeight: 600 }}>{order.delivery.vehicle}</p></div>}
                    <div><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Status</p><span className={`tag tag-${order.delivery.status}`}>{order.delivery.status}</span></div>
                    {order.delivery.expected_date && <div><p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Expected Delivery</p><p style={{ fontWeight: 600 }}>{formatDate(order.delivery.expected_date)}</p></div>}
                  </div>
                  {order.delivery.notes && (
                    <div style={{ marginTop: 12, padding: 8, background: 'var(--surface-2)', borderRadius: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
                      📝 {order.delivery.notes}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Summary */}
            <div className="cart-summary">
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Order Summary</h3>
              <div className="cart-summary-row"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString('en-IN')}</span></div>
              <div className="cart-summary-row">
                <span>Delivery Charge</span>
                <span>₹{order.delivery_charge?.toLocaleString('en-IN')}</span>
              </div>
              {order.delivery_distance_km && (
                <div style={{ fontSize: 11, color: '#0ea5e9', textAlign: 'right', marginTop: -6, marginBottom: 6 }}>
                  📏 {order.delivery_distance_km} km from factory
                </div>
              )}
              <div className="cart-summary-row"><strong>Total</strong><span className="cart-summary-total">₹{order.total?.toLocaleString('en-IN')}</span></div>
              <hr className="divider" />
              <div style={{ fontSize: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment</span>
                  <span style={{ fontWeight: 600 }}>{order.payment_method?.toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payment Status</span>
                  <PaymentStatusTag status={order.payment_status} />
                </div>
              </div>
            </div>

            {/* Delivery Address & GPS Location */}
            <div className="card">
              <div className="card-body">
                <p style={{ fontWeight: 700, marginBottom: 12 }}>{t(lang, 'address')}</p>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>
                  {[order.delivery_house, order.delivery_street, order.delivery_area, order.delivery_city, order.delivery_state, order.delivery_pincode].filter(Boolean).join(', ')}
                </p>

                {order.delivery_lat && order.delivery_lng && (
                  <div style={{ padding: 12, background: 'rgba(14,165,233,0.08)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.25)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 12, color: '#0ea5e9', marginBottom: 4 }}>
                      <MapPin size={14} /> GPS Location Shared
                    </div>
                    {order.delivery_distance_km && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                        Distance: {order.delivery_distance_km} km from factory
                      </p>
                    )}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#0ea5e9', fontSize: 12, fontWeight: 600 }}
                    >
                      Open in Maps <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
