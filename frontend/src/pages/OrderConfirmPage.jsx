import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, Package, MapPin, ExternalLink, MessageCircle, Truck } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import { LoadingPage } from '../components/utils';
import api from '../api';

export default function OrderConfirmPage() {
  const { id } = useParams();
  const { lang } = useLang();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/my/${id}`).then(r => setOrder(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><LoadingPage /></div>;
  if (!order) return null;

  const hasGps = order.delivery_lat && order.delivery_lng;
  const mapsUrl = hasGps ? `https://www.google.com/maps/search/?api=1&query=${order.delivery_lat},${order.delivery_lng}` : null;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 640 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '3px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', animation: 'pulse 2s infinite' }}>
            <CheckCircle size={44} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--success)', marginBottom: 8 }}>
            {t(lang, 'orderSuccess')}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>{t(lang, 'orderSuccessSub')}</p>
        </div>

        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>{t(lang, 'orderId')}</p>
                <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--primary)' }}>{order.order_number}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Grand Total</p>
                <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>₹{order.total?.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Payment Method</p>
                <p style={{ fontWeight: 600 }}>{order.payment_method?.toUpperCase()}</p>
              </div>
              <div>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Status</p>
                <span className="tag tag-placed" style={{ textTransform: 'capitalize' }}>
                  {order.order_status || 'Order Placed'}
                </span>
              </div>
            </div>

            {/* GPS Location & Distance block */}
            {hasGps && (
              <div style={{ marginTop: 20, padding: 14, background: 'rgba(14,165,233,0.08)', borderRadius: 10, border: '1px solid rgba(14,165,233,0.25)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13, color: '#0ea5e9' }}>
                    <MapPin size={16} /> Delivery Location Shared
                  </div>
                  {order.delivery_distance_km && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#0ea5e9', background: 'rgba(14,165,233,0.15)', padding: '2px 8px', borderRadius: 12 }}>
                      📏 {order.delivery_distance_km} km from factory
                    </span>
                  )}
                </div>
                {order.delivery_location_label && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                    {order.delivery_location_label}
                  </p>
                )}
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#0ea5e9', fontWeight: 600 }}
                >
                  View on Google Maps <ExternalLink size={12} />
                </a>
              </div>
            )}

            <hr className="divider" />

            <div>
              <p style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>Items Ordered</p>
              {order.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span>{item.product_name} × {item.quantity?.toLocaleString('en-IN')}</span>
                  <span style={{ fontWeight: 600 }}>₹{item.subtotal?.toLocaleString('en-IN')}</span>
                </div>
              ))}
              {order.delivery_charge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 0', color: 'var(--text-secondary)' }}>
                  <span>Delivery Charge {order.delivery_distance_km ? `(${order.delivery_distance_km} km)` : ''}</span>
                  <span>₹{order.delivery_charge?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontWeight: 800, fontSize: 16 }}>
                <span>Grand Total</span>
                <span style={{ color: 'var(--primary)' }}>₹{order.total?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          <Link to={`/orders/${id}`} className="btn btn-primary btn-lg" style={{ justifyContent: 'center' }}>
            <Package size={18} /> {t(lang, 'viewOrder')} & Live Tracking
          </Link>

          <a
            href={`https://wa.me/916366194899?text=${encodeURIComponent(`Hello MBI Bricks, I have placed order #${order.order_number}. Please update me once it is dispatched!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg"
            style={{ justifyContent: 'center', color: '#22c55e', borderColor: '#22c55e', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <MessageCircle size={18} /> WhatsApp Factory for Dispatch Update
          </a>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <Link to="/orders" style={{ color: 'var(--text-muted)', fontSize: 14 }}>{t(lang, 'myOrders')}</Link>
            <Link to="/products" style={{ color: 'var(--text-muted)', fontSize: 14 }}>← {t(lang, 'continueShopping2')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
