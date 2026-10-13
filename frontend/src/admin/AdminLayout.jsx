import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, ShoppingBag, Package, Warehouse, Users,
  CreditCard, FileText, Truck, Receipt, BarChart3, Settings,
  LogOut, Menu, X, Bell, Check, ExternalLink, MessageCircle
} from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const NAV = [
  { to: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/admin/orders', icon: <ShoppingBag size={18} />, label: 'Orders' },
  { to: '/admin/products', icon: <Package size={18} />, label: 'Products' },
  { to: '/admin/inventory', icon: <Warehouse size={18} />, label: 'Inventory' },
  { to: '/admin/customers', icon: <Users size={18} />, label: 'Customers' },
  { to: '/admin/payments', icon: <CreditCard size={18} />, label: 'Payments' },
  { to: '/admin/invoices', icon: <FileText size={18} />, label: 'Invoices' },
  { to: '/admin/deliveries', icon: <Truck size={18} />, label: 'Deliveries' },
  { to: '/admin/expenses', icon: <Receipt size={18} />, label: 'Expenses' },
  { to: '/admin/reports', icon: <BarChart3 size={18} />, label: 'Reports' },
  { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  const handleLogout = () => { logout(); navigate('/admin/login'); };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">🧱</div>
          <span style={{ background: 'linear-gradient(135deg,#e05a20,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>MBI BRICKS</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section">Management</div>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} onClick={() => setSidebarOpen(false)}>
              {item.icon} {item.label}
              {item.label === 'Orders' && unreadCount > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: 11, fontWeight: 700, padding: '1px 6px', borderRadius: 10 }}>
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 8px', borderTop: '1px solid var(--border)' }}>
          <div style={{ padding: '12px', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          <button className="sidebar-link" style={{ width: '100%', color: 'var(--error)' }} onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="admin-main">
        {/* Topbar */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn btn-ghost btn-icon" style={{ display: 'none' }} id="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <span style={{ fontWeight: 700 }}>MBI Bricks Industries</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* 🔔 Notifications Bell */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                className="btn btn-ghost btn-icon"
                style={{ position: 'relative', padding: 8 }}
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                title="Notifications"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: 2,
                    right: 2,
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 18,
                    height: 18,
                    fontSize: 10,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(239,68,68,0.6)',
                    animation: 'pulse 2s infinite'
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotifMenu && (
                <div style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 8,
                  width: 360,
                  maxHeight: 450,
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                  zIndex: 1000,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--surface-2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                      {unreadCount > 0 && (
                        <span style={{ fontSize: 11, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        style={{ fontSize: 12, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ overflowY: 'auto', flex: 1, maxHeight: 360 }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No notifications yet.
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid var(--border)',
                            background: n.is_read ? 'transparent' : 'rgba(194,68,15,0.06)',
                            transition: 'background 0.2s',
                            cursor: 'pointer'
                          }}
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            setShowNotifMenu(false);
                            navigate('/admin/orders');
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                            <div style={{ fontWeight: n.is_read ? 600 : 700, fontSize: 13, color: n.is_read ? 'var(--text-primary)' : 'var(--primary)' }}>
                              {n.title}
                            </div>
                            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.4 }}>
                            {n.message}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', textAlign: 'center' }}>
                    <Link
                      to="/admin/orders"
                      onClick={() => setShowNotifMenu(false)}
                      style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
                    >
                      View All Orders & Dispatches →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Admin Panel</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
              {user?.full_name?.[0] || 'A'}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <Outlet />
      </main>

      {/* Mobile overlay */}
      {sidebarOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={() => setSidebarOpen(false)} />}
    </div>
  );
}
