import { useState, useEffect } from 'react';
import { User, Package, MapPin, CreditCard, Lock, LogOut } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { t } from '../translations';
import { LoadingPage, formatDate, formatPrice } from '../components/utils';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';

const TABS = ['profile', 'orders', 'addresses', 'payments', 'password'];

export default function ProfilePage() {
  const { lang } = useLang();
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [addrForm, setAddrForm] = useState({ house: '', street: '', area: '', city: '', state: 'Karnataka', pincode: '', label: 'Home' });
  const [addingAddr, setAddingAddr] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tab === 'orders') api.get('/orders/my').then(r => setOrders(r.data));
    if (tab === 'addresses') api.get('/customers/my/addresses').then(r => setAddresses(r.data));
    if (tab === 'payments') api.get('/payments/my').then(r => setPayments(r.data));
  }, [tab]);

  const updateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await api.put('/auth/profile', form);
      updateUser(r.data);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update'); } finally { setSaving(false); }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await api.post('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      toast.success('Password changed!');
      setPwForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const addAddress = async () => {
    if (!addrForm.city || !addrForm.pincode) { toast.error('Fill required fields'); return; }
    await api.post('/customers/my/addresses', { ...addrForm, is_default: !addresses.length });
    const r = await api.get('/customers/my/addresses');
    setAddresses(r.data);
    setAddingAddr(false);
    setAddrForm({ house: '', street: '', area: '', city: '', state: 'Karnataka', pincode: '', label: 'Home' });
    toast.success('Address added!');
  };

  const deleteAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    await api.delete(`/customers/my/addresses/${id}`);
    setAddresses(a => a.filter(x => x.id !== id));
    toast.success('Address deleted');
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const tabIcons = { profile: <User size={16} />, orders: <Package size={16} />, addresses: <MapPin size={16} />, payments: <CreditCard size={16} />, password: <Lock size={16} /> };
  const tabLabels = { profile: t(lang, 'myProfile'), orders: t(lang, 'myOrders'), addresses: t(lang, 'savedAddresses2'), payments: t(lang, 'paymentHistory'), password: t(lang, 'changePassword') };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>{t(lang, 'myProfile')}</h1>
        <div className="profile-layout">
          {/* Nav */}
          <div>
            <div className="profile-nav">
              {TABS.map(key => (
                <div key={key} className={`profile-nav-link ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}>
                  {tabIcons[key]} {tabLabels[key]}
                </div>
              ))}
              <div className="profile-nav-link" style={{ color: 'var(--error)' }} onClick={handleLogout}>
                <LogOut size={16} /> {t(lang, 'logout')}
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            {/* Profile */}
            {tab === 'profile' && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'myProfile')}</h3></div>
                <div className="card-body">
                  <form onSubmit={updateProfile}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                      <div className="form-group">
                        <label className="form-label">{t(lang, 'fullName')}</label>
                        <input className="form-input" value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">{t(lang, 'mobile')}</label>
                        <input className="form-input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1/-1' }}>
                        <label className="form-label">{t(lang, 'email')}</label>
                        <input className="form-input" value={user?.email} readOnly style={{ opacity: 0.6 }} />
                      </div>
                    </div>
                    <button className="btn btn-primary" type="submit" style={{ marginTop: 20 }} disabled={saving}>
                      {saving ? 'Saving...' : t(lang, 'updateProfile')}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* Orders */}
            {tab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {!orders.length ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>No orders yet. <Link to="/products" style={{ color: 'var(--primary)' }}>Start shopping!</Link></div> : orders.map(o => (
                  <div key={o.id} className="order-card">
                    <div className="order-card-header">
                      <div><span className="order-number">{o.order_number}</span><div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(o.created_at)}</div></div>
                      <span className={`tag tag-${o.order_status}`}>{o.order_status}</span>
                    </div>
                    <div className="order-card-body" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{o.items_summary}</div>
                    <div className="order-card-footer">
                      <span style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{o.total?.toLocaleString('en-IN')}</span>
                      <Link to={`/orders/${o.id}`} className="btn btn-secondary btn-sm">View</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Addresses */}
            {tab === 'addresses' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h3 style={{ fontWeight: 700 }}>{t(lang, 'savedAddresses2')}</h3>
                  <button className="btn btn-primary btn-sm" onClick={() => setAddingAddr(true)}>+ {t(lang, 'addAddress')}</button>
                </div>
                {addingAddr && (
                  <div className="card" style={{ marginBottom: 20 }}>
                    <div className="card-body">
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {['house', 'street', 'area', 'city', 'state', 'pincode'].map(k => (
                          <div key={k} className="form-group">
                            <label className="form-label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                            <input className="form-input" value={addrForm[k]} onChange={e => setAddrForm(f => ({ ...f, [k]: e.target.value }))} />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button className="btn btn-primary btn-sm" onClick={addAddress}>Save</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setAddingAddr(false)}>Cancel</button>
                      </div>
                    </div>
                  </div>
                )}
                {addresses.map(addr => (
                  <div key={addr.id} className="card" style={{ marginBottom: 12 }}>
                    <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 700, marginBottom: 4 }}>{addr.label} {addr.is_default ? <span className="badge badge-primary" style={{ fontSize: 10 }}>Default</span> : null}</div>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                          {[addr.house, addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteAddress(addr.id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {!addresses.length && <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No saved addresses</p>}
              </div>
            )}

            {/* Payments */}
            {tab === 'payments' && (
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: 20 }}>{t(lang, 'paymentHistory')}</h3>
                {!payments.length ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No payment history</p> : (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Order</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p.id}>
                            <td><Link to={`/orders/${p.order_id}`} style={{ color: 'var(--primary)', fontWeight: 700 }}>{p.order_number}</Link></td>
                            <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString('en-IN')}</td>
                            <td>{p.method?.toUpperCase()}</td>
                            <td style={{ color: 'var(--text-muted)' }}>{formatDate(p.payment_date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Change Password */}
            {tab === 'password' && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'changePassword')}</h3></div>
                <div className="card-body">
                  <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 400 }}>
                    <div className="form-group">
                      <label className="form-label">{t(lang, 'currentPassword')}</label>
                      <input type="password" className="form-input" value={pwForm.current_password} onChange={e => setPwForm(f => ({ ...f, current_password: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t(lang, 'newPassword')}</label>
                      <input type="password" className="form-input" value={pwForm.new_password} onChange={e => setPwForm(f => ({ ...f, new_password: e.target.value }))} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t(lang, 'confirmPassword')}</label>
                      <input type="password" className="form-input" value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                    </div>
                    <button className="btn btn-primary" type="submit">{t(lang, 'changePassword')}</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
