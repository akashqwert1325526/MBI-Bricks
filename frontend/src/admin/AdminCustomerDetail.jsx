import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LoadingPage, OrderStatusTag, PaymentStatusTag, formatDate } from '../components/utils';
import api from '../api';

export default function AdminCustomerDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('orders');

  useEffect(() => {
    api.get(`/customers/${id}`).then(r => setData(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="admin-page"><LoadingPage /></div>;
  if (!data) return null;

  const totalPaid = data.payments?.reduce((s, p) => s + p.amount, 0) || 0;
  const pendingOrders = data.orders?.filter(o => !['delivered','cancelled'].includes(o.order_status)) || [];

  return (
    <div className="admin-page">
      <Link to="/admin/customers" className="back-link"><ChevronLeft size={18}/> Customers</Link>

      {/* Header */}
      <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,var(--primary),var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 28, color: 'white', flexShrink: 0 }}>
          {data.full_name?.[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="admin-page-title" style={{ marginBottom: 4 }}>{data.full_name}</h1>
          <div style={{ display: 'flex', gap: 16, fontSize: 14, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
            <span>📧 {data.email}</span>
            <span>📞 {data.phone}</span>
            {data.city && <span>📍 {data.city}, {data.state}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {[
          { label: 'Total Orders', value: data.total_orders || 0, color: '#3b82f6' },
          { label: 'Total Spent', value: `₹${(data.total_spent || 0).toLocaleString('en-IN')}`, color: '#f59e0b' },
          { label: 'Total Paid', value: `₹${totalPaid.toLocaleString('en-IN')}`, color: '#22c55e' },
          { label: 'Active Orders', value: pendingOrders.length, color: '#c2440f' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab==='orders'?'active':''}`} onClick={()=>setTab('orders')}>Orders ({data.orders?.length||0})</button>
        <button className={`tab ${tab==='payments'?'active':''}`} onClick={()=>setTab('payments')}>Payments ({data.payments?.length||0})</button>
        <button className={`tab ${tab==='addresses'?'active':''}`} onClick={()=>setTab('addresses')}>Addresses</button>
      </div>

      {tab === 'orders' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order ID</th><th>Date</th><th>Total</th><th>Payment</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {data.orders?.map(o => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 800, color: 'var(--primary)' }}>{o.order_number}</Link></td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</td>
                  <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{o.total?.toLocaleString('en-IN')}</td>
                  <td><PaymentStatusTag status={o.payment_status}/></td>
                  <td><OrderStatusTag status={o.order_status}/></td>
                  <td><Link to={`/admin/orders/${o.id}`} className="btn btn-secondary btn-sm">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'payments' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Order</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
            <tbody>
              {data.payments?.map(p => (
                <tr key={p.id}>
                  <td><Link to={`/admin/orders/${p.order_id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{p.order_number}</Link></td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                  <td>{p.method?.toUpperCase()}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'addresses' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.addresses?.map(a => (
            <div key={a.id} className="card">
              <div className="card-body">
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{a.label} {a.is_default ? <span className="badge badge-primary" style={{fontSize:10}}>Default</span> : null}</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  {[a.house,a.street,a.area,a.city,a.state,a.pincode].filter(Boolean).join(', ')}
                </p>
              </div>
            </div>
          ))}
          {!data.addresses?.length && <p style={{ color: 'var(--text-muted)', padding: 40, textAlign: 'center' }}>No addresses saved</p>}
        </div>
      )}
    </div>
  );
}
