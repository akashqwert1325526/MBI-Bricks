import { useState, useEffect } from 'react';
import { Save, Plus, Trash2, MapPin } from 'lucide-react';
import api from '../api';
import toast from 'react-hot-toast';

const DEFAULT_TIERS = [
  { max_km: 10, charge: 500 },
  { max_km: 25, charge: 1000 },
  { max_km: 50, charge: 1500 },
  { max_km: 100, charge: 2500 },
  { max_km: 9999, charge: 4000 },
];

export default function AdminSettings() {
  const [form, setForm] = useState({
    business_name: '', business_address: '', business_phone: '', business_email: '',
    gst_number: '', delivery_charge: '1500', currency: 'INR',
    invoice_prefix: 'INV', order_prefix: 'MBI', terms_conditions: '',
    owner_whatsapp: '', business_lat: '', business_lng: '',
    delivery_rate_mode: 'distance',
  });
  const [tiers, setTiers] = useState(DEFAULT_TIERS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState('business');
  const [locLoading, setLocLoading] = useState(false);

  useEffect(() => {
    api.get('/settings').then(r => {
      const s = r.data;
      setForm(f => ({ ...f, ...s }));
      if (s.delivery_rate_tiers) {
        try { setTiers(JSON.parse(s.delivery_rate_tiers)); } catch {}
      }
    }).finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const setTier = (i, field, val) => {
    setTiers(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: Number(val) } : t));
  };

  const addTier = () => setTiers(prev => [...prev, { max_km: 200, charge: 5000 }]);
  const removeTier = (i) => setTiers(prev => prev.filter((_, idx) => idx !== i));

  const captureBusinessLocation = () => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(f => ({ ...f, business_lat: String(pos.coords.latitude.toFixed(6)), business_lng: String(pos.coords.longitude.toFixed(6)) }));
        toast.success('📍 Business location captured!');
        setLocLoading(false);
      },
      () => { toast.error('Could not get location'); setLocLoading(false); },
      { timeout: 8000 }
    );
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        delivery_rate_tiers: JSON.stringify(tiers.sort((a, b) => a.max_km - b.max_km)),
      };
      await api.put('/settings', payload);
      toast.success('Settings saved!');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); } finally { setSaving(false); }
  };

  if (loading) return <div className="admin-page"><div style={{ padding: 40, color: 'var(--text-muted)' }}>Loading...</div></div>;

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Settings</h1>
      <p className="admin-page-subtitle">Configure your business settings</p>

      <div className="tabs">
        <button className={`tab ${tab === 'business' ? 'active' : ''}`} onClick={() => setTab('business')}>Business Info</button>
        <button className={`tab ${tab === 'delivery' ? 'active' : ''}`} onClick={() => setTab('delivery')}>Delivery & Rates</button>
        <button className={`tab ${tab === 'order' ? 'active' : ''}`} onClick={() => setTab('order')}>Order Settings</button>
        <button className={`tab ${tab === 'billing' ? 'active' : ''}`} onClick={() => setTab('billing')}>Billing & Invoice</button>
      </div>

      <div className="card">
        <div className="card-body">

          {tab === 'business' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Business Name</label>
                <input className="form-input" value={form.business_name || ''} onChange={set('business_name')} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.business_phone || ''} onChange={set('business_phone')} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" type="email" value={form.business_email || ''} onChange={set('business_email')} />
              </div>
              <div className="form-group">
                <label className="form-label">Owner WhatsApp Number</label>
                <input className="form-input" value={form.owner_whatsapp || ''} onChange={set('owner_whatsapp')} placeholder="+919876543210" />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Used for new order notifications</span>
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input className="form-input" value={form.gst_number || ''} onChange={set('gst_number')} placeholder="29XXXXX..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Address</label>
                <textarea className="form-input" value={form.business_address || ''} onChange={set('business_address')} />
              </div>
              <div className="form-group">
                <label className="form-label">Currency</label>
                <select className="form-input form-select" value={form.currency || 'INR'} onChange={set('currency')}>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'delivery' && (
            <div>
              {/* Business Location */}
              <div style={{ marginBottom: 32 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 4, fontSize: 15 }}>📍 Factory / Business Location</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                  Set your factory's GPS coordinates. Customer delivery charges will be calculated based on distance from this point.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Latitude</label>
                    <input className="form-input" value={form.business_lat || ''} onChange={set('business_lat')} placeholder="13.6950" />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Longitude</label>
                    <input className="form-input" value={form.business_lng || ''} onChange={set('business_lng')} placeholder="76.3936" />
                  </div>
                  <button
                    className="btn btn-secondary"
                    onClick={captureBusinessLocation}
                    disabled={locLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <MapPin size={15} />
                    {locLoading ? 'Getting...' : 'Use My Location'}
                  </button>
                </div>
                {form.business_lat && form.business_lng && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)' }}>
                    📌 Set to: {form.business_lat}, {form.business_lng} —
                    <a href={`https://www.google.com/maps?q=${form.business_lat},${form.business_lng}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0ea5e9', marginLeft: 4 }}>View on Maps ↗</a>
                  </div>
                )}
              </div>

              {/* Delivery Rate Mode */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>🚛 Delivery Charge Mode</h3>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[
                    { val: 'flat', label: '📦 Flat Rate', desc: 'Same charge for everyone' },
                    { val: 'distance', label: '📏 Distance-Based', desc: 'Charge by km from factory' },
                  ].map(opt => (
                    <div
                      key={opt.val}
                      onClick={() => setForm(f => ({ ...f, delivery_rate_mode: opt.val }))}
                      style={{
                        flex: 1, padding: 16, border: `2px solid ${form.delivery_rate_mode === opt.val ? 'var(--primary)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius)', cursor: 'pointer', background: form.delivery_rate_mode === opt.val ? 'rgba(194,68,15,0.05)' : 'var(--surface-2)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>{opt.label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{opt.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flat Rate */}
              {form.delivery_rate_mode === 'flat' && (
                <div className="form-group" style={{ maxWidth: 300 }}>
                  <label className="form-label">Flat Delivery Charge (₹)</label>
                  <input className="form-input" type="number" value={form.delivery_charge || ''} onChange={set('delivery_charge')} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Applied to all orders regardless of distance</span>
                </div>
              )}

              {/* Distance-Based Tiers */}
              {form.delivery_rate_mode === 'distance' && (
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 15 }}>📏 Distance Rate Tiers</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                    Set delivery charges for different distance ranges. Orders are charged based on the customer's GPS distance from your factory.
                    The last tier acts as the maximum-distance fallback.
                  </p>
                  <div style={{ display: 'grid', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Within (km)</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Charge (₹)</span>
                      <span></span>
                    </div>
                    {tiers.map((tier, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {i > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            {tiers[i-1].max_km} – 
                          </span>}
                          <input
                            className="form-input"
                            type="number"
                            value={tier.max_km === 9999 ? '' : tier.max_km}
                            placeholder={tier.max_km === 9999 ? 'Beyond all (fallback)' : ''}
                            onChange={e => setTier(i, 'max_km', e.target.value || 9999)}
                            style={{ flex: 1 }}
                            disabled={tier.max_km === 9999}
                          />
                          {tier.max_km !== 9999 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>km</span>}
                          {tier.max_km === 9999 && <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Beyond all</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: 'var(--text-muted)' }}>₹</span>
                          <input
                            className="form-input"
                            type="number"
                            value={tier.charge}
                            onChange={e => setTier(i, 'charge', e.target.value)}
                            style={{ flex: 1 }}
                          />
                        </div>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ color: 'var(--error)', padding: 8 }}
                          onClick={() => removeTier(i)}
                          disabled={tiers.length <= 1}
                          title="Remove tier"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 16 }} onClick={addTier}>
                    <Plus size={14} /> Add Distance Tier
                  </button>

                  {/* Preview */}
                  <div style={{ marginTop: 24, background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>📋 Rate Preview</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {tiers.sort((a,b)=>a.max_km-b.max_km).map((tier, i) => (
                        <div key={i} style={{ padding: '6px 12px', background: 'var(--surface)', borderRadius: 20, border: '1px solid var(--border)', fontSize: 12 }}>
                          {tier.max_km === 9999 ? 'Beyond' : `≤ ${tier.max_km} km`}: <strong style={{ color: 'var(--primary)' }}>₹{tier.charge}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'order' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="form-group">
                <label className="form-label">Order Number Prefix</label>
                <input className="form-input" value={form.order_prefix || 'MBI'} onChange={set('order_prefix')} placeholder="MBI" />
              </div>
              <div className="form-group">
                <label className="form-label">Default Delivery Charge (₹)</label>
                <input className="form-input" type="number" value={form.delivery_charge || ''} onChange={set('delivery_charge')} />
                <span style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>Used as fallback when distance is unavailable</span>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Terms & Conditions</label>
                <textarea className="form-input" style={{ minHeight: 120 }} value={form.terms_conditions || ''} onChange={set('terms_conditions')} placeholder="Enter terms and conditions shown on invoices..." />
              </div>
            </div>
          )}

          {tab === 'billing' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div className="form-group">
                <label className="form-label">Invoice Number Prefix</label>
                <input className="form-input" value={form.invoice_prefix || 'INV'} onChange={set('invoice_prefix')} placeholder="INV" />
              </div>
              <div className="form-group">
                <label className="form-label">GST Number</label>
                <input className="form-input" value={form.gst_number || ''} onChange={set('gst_number')} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 20, border: '1px solid var(--border)' }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 12 }}>Invoice Preview</h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Invoice numbers will be formatted as: <strong>{form.invoice_prefix || 'INV'}-000001</strong></p>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>Order numbers: <strong>{form.order_prefix || 'MBI'}-000001</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
