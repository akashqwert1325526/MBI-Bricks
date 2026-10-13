import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShoppingBag, Users, Warehouse, CreditCard, AlertTriangle, Layers } from 'lucide-react';
import { LoadingPage } from '../components/utils';
import { getDashboardStats } from '../services/firebaseService';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return <div className="admin-page"><LoadingPage /></div>;

  const cards = [
    { icon: <TrendingUp size={22} />, color: '#c2440f', bg: 'rgba(194,68,15,0.15)', label: 'Total Sales', value: `₹${(stats?.totalSales || 0).toLocaleString('en-IN')}` },
    { icon: <ShoppingBag size={22} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)', label: 'Total Orders', value: stats?.totalOrders || 0 },
    { icon: <CreditCard size={22} />, color: '#ef4444', bg: 'rgba(239,68,68,0.15)', label: 'Pending Payments', value: `₹${(stats?.pendingPayments || 0).toLocaleString('en-IN')}` },
    { icon: <Users size={22} />, color: '#22c55e', bg: 'rgba(34,197,94,0.15)', label: 'Total Customers', value: stats?.totalCustomers || 0 },
    { icon: <Warehouse size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)', label: 'Wirecut Stock', value: `${(stats?.wirecutStock || 0).toLocaleString('en-IN')} pcs` },
    { icon: <Layers size={22} />, color: '#0ea5e9', bg: 'rgba(14,165,233,0.15)', label: 'Table Mould Stock', value: `${(stats?.tableMouldStock || 0).toLocaleString('en-IN')} pcs` },
  ];

  const lowStockWirecut = (stats?.wirecutStock || 0) < 5000;
  const lowStockTableMould = (stats?.tableMouldStock || 0) < 5000;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Management Dashboard</h1>
      <p className="admin-page-subtitle">Real-time Business & Factory Performance Statistics</p>

      {/* Low Stock Alerts */}
      {(lowStockWirecut || lowStockTableMould) && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={18} />
          <span>
            ⚠ Stock Warning: {lowStockWirecut && 'Wirecut Brick '} {lowStockWirecut && lowStockTableMould && '& '} {lowStockTableMould && 'Table Mould Brick '} level is below 5,000 units.
            <Link to="/admin/inventory" style={{ color: 'inherit', textDecoration: 'underline', marginLeft: 8 }}>Manage Inventory →</Link>
          </span>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="stat-grid" style={{ marginBottom: 32 }}>
        {cards.map((c, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: c.bg, color: c.color }}>{c.icon}</div>
            <div className="stat-value">{c.value}</div>
            <div className="stat-label">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Orders Section */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 className="modal-title">Recent Orders</h3>
          <Link to="/admin/orders" className="btn btn-ghost btn-sm">View All Orders →</Link>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Delivery</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {!stats?.recentOrders?.length ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                    No orders recorded yet in Firestore.
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map(o => (
                  <tr key={o.id}>
                    <td>
                      <Link to={`/admin/orders/${o.id}`} style={{ fontWeight: 800, color: 'var(--primary)' }}>
                        {o.orderNumber || o.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td style={{ fontWeight: 600 }}>{o.customerName || 'Customer'}</td>
                    <td>{o.productName || 'Brick'}</td>
                    <td>{(o.quantity || 0).toLocaleString('en-IN')} pcs</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent)' }}>₹{(o.totalAmount || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`tag ${o.paymentStatus === 'paid' ? 'tag-delivered' : 'tag-cancelled'}`}>
                        {o.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={`tag ${o.deliveryStatus === 'delivered' ? 'tag-delivered' : 'tag-confirmed'}`}>
                        {o.deliveryStatus?.replace(/_/g, ' ')?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {o.orderDate ? new Date(o.orderDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {[
          { to: '/admin/orders', label: 'Create & Manage Orders', icon: '📋', color: '#3b82f6' },
          { to: '/admin/inventory', label: 'Check Brick Stock', icon: '📦', color: '#22c55e' },
          { to: '/admin/customers', label: 'Customer Directory', icon: '👥', color: '#f59e0b' },
          { to: '/admin/payments', label: 'Record Payments', icon: '💳', color: '#a855f7' },
        ].map((l, i) => (
          <Link key={i} to={l.to} className="card" style={{ textDecoration: 'none', padding: 20, display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s' }}>
            <span style={{ fontSize: 28 }}>{l.icon}</span>
            <span style={{ fontWeight: 700, fontSize: 14, color: l.color }}>{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
