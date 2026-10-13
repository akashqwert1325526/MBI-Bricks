import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, RefreshCw } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import { LoadingPage, EmptyState, OrderStatusTag, PaymentStatusTag, formatDate } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

export default function OrdersPage() {
  const { lang } = useLang();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data)).finally(() => setLoading(false));
  }, []);

  const handleReorder = async (orderId) => {
    try {
      const r = await api.post(`/orders/reorder/${orderId}`);
      toast.success('Items added to cart!');
      if (r.data.errors?.length) r.data.errors.forEach(e => toast.error(e));
    } catch (err) { toast.error('Failed to reorder'); }
  };

  if (loading) return <div className="page"><LoadingPage /></div>;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{t(lang, 'orderHistory')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>

        {!orders.length ? (
          <EmptyState
            icon="📦"
            title={t(lang, 'noOrders')}
            desc={t(lang, 'noOrdersSub')}
            action={<Link to="/products" className="btn btn-primary">Shop Bricks</Link>}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {orders.map(order => (
              <div key={order.id} className="order-card">
                <div className="order-card-header">
                  <div>
                    <span className="order-number">{order.order_number}</span>
                    <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>{formatDate(order.created_at)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <OrderStatusTag status={order.order_status} />
                    <PaymentStatusTag status={order.payment_status} />
                  </div>
                </div>

                <div className="order-card-body">
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 8 }}>
                    {order.items_summary || '—'}
                  </p>
                  <div style={{ display: 'flex', gap: 24, fontSize: 14 }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Total: </span><strong style={{ color: 'var(--primary)' }}>₹{order.total?.toLocaleString('en-IN')}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Payment: </span><strong>{order.payment_method?.toUpperCase()}</strong></div>
                  </div>
                </div>

                <div className="order-card-footer">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm">
                      <Package size={14} /> {t(lang, 'viewDetails2')}
                    </Link>
                    <Link to={`/orders/${order.id}#track`} className="btn btn-outline btn-sm">
                      {t(lang, 'trackOrder')}
                    </Link>
                  </div>
                  {order.order_status === 'delivered' && (
                    <button className="btn btn-accent btn-sm" onClick={() => handleReorder(order.id)}>
                      <RefreshCw size={14} /> {t(lang, 'buyAgain')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
