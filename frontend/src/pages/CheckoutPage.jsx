import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, Plus, Home, CreditCard, Smartphone, Banknote, Building, MapPin, Navigation, Loader } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { t } from '../translations';
import api from '../api';
import toast from 'react-hot-toast';

const STEPS = ['customerDetails', 'deliveryAddress', 'orderSummary', 'payment'];

export default function CheckoutPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { cart, fetchCart } = useCart();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddr, setSelectedAddr] = useState(null);
  const [addingAddr, setAddingAddr] = useState(false);
  const [payMethod, setPayMethod] = useState('cod');
  const [placing, setPlacing] = useState(false);
  const [phone, setPhone] = useState('');

  // GPS / Location state
  const [location, setLocation] = useState(null); // { lat, lng, label }
  const [locLoading, setLocLoading] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(1500);
  const [distanceKm, setDistanceKm] = useState(null);
  const [chargeLoading, setChargeLoading] = useState(false);

  const [newAddr, setNewAddr] = useState({ house: '', street: '', area: '', city: '', state: 'Karnataka', pincode: '' });

  const subtotal = cart.items?.reduce((s, i) => s + i.quantity * i.price, 0) || 0;
  const total = subtotal + deliveryCharge;

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    api.get('/customers/my/addresses').then(r => {
      const data = Array.isArray(r.data) ? r.data : [];
      setAddresses(data);
      const def = data.find(a => a.is_default) || data[0];
      if (def) setSelectedAddr(def);
    }).catch(() => {});
  }, [user]);

  // Fetch delivery charge whenever location changes
  useEffect(() => {
    if (!location) return;
    setChargeLoading(true);
    api.post('/notifications/delivery-charge', { lat: location.lat, lng: location.lng })
      .then(r => {
        setDeliveryCharge(r.data.charge);
        setDistanceKm(r.data.distance_km);
      })
      .catch(() => {})
      .finally(() => setChargeLoading(false));
  }, [location]);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
        let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        let geoAddr = null;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          label = data.display_name?.split(',').slice(0, 3).join(',') || label;
          if (data.address) {
            geoAddr = {
              house: data.address.house_number || '',
              street: data.address.road || '',
              area: data.address.suburb || data.address.neighbourhood || '',
              city: data.address.city || data.address.town || data.address.village || 'Bengaluru',
              state: data.address.state || 'Karnataka',
              pincode: data.address.postcode || ''
            };
          }
        } catch {}

        setLocation({ lat, lng, label });

        // Auto-fill address form fields and select as delivery address
        const autoAddr = {
          id: 'gps_' + Date.now(),
          label: 'Current GPS Location',
          house: geoAddr?.house || '',
          street: geoAddr?.street || label,
          area: geoAddr?.area || '',
          city: geoAddr?.city || 'Bengaluru',
          state: geoAddr?.state || 'Karnataka',
          pincode: geoAddr?.pincode || '560001'
        };

        setNewAddr(prev => ({
          ...prev,
          house: prev.house || autoAddr.house,
          street: prev.street || autoAddr.street,
          area: prev.area || autoAddr.area,
          city: prev.city || autoAddr.city,
          state: prev.state || autoAddr.state,
          pincode: prev.pincode || autoAddr.pincode
        }));

        setSelectedAddr(autoAddr);
        toast.success('📍 Location captured & address selected!');
        setLocLoading(false);
      },
      (err) => {
        toast.error('Could not get your location. Please allow location access.');
        setLocLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const clearLocation = () => {
    setLocation(null);
    setDistanceKm(null);
    setDeliveryCharge(1500);
  };

  const saveAddr = async () => {
    if (!newAddr.city && !newAddr.pincode && !newAddr.street) {
      toast.error('Please enter delivery address details (city/pincode)');
      return null;
    }
    const addrToSave = {
      ...newAddr,
      city: newAddr.city || 'Bengaluru',
      state: newAddr.state || 'Karnataka',
      pincode: newAddr.pincode || '560001',
      label: newAddr.label || 'Delivery Site',
      is_default: !addresses.length
    };

    try {
      const r = await api.post('/customers/my/addresses', addrToSave);
      const updated = await api.get('/customers/my/addresses');
      const list = Array.isArray(updated?.data) ? updated.data : [];
      setAddresses(list);
      const chosen = (r?.data?.id ? list.find(a => a.id === r.data.id) : null) || list[0] || { ...addrToSave, id: r?.data?.id || Date.now() };
      setSelectedAddr(chosen);
      setAddingAddr(false);
      toast.success('Address saved');
      return chosen;
    } catch (err) {
      const fallback = { ...addrToSave, id: 'temp_' + Date.now() };
      setAddresses(prev => [...prev, fallback]);
      setSelectedAddr(fallback);
      setAddingAddr(false);
      toast.success('Address set for this order');
      return fallback;
    }
  };

  const handleStep1Next = async () => {
    // 1. If an address is already selected
    if (selectedAddr) {
      setStep(2);
      return;
    }

    // 2. If user typed into the address fields, auto-save and advance
    if (newAddr.street || newAddr.area || newAddr.city || newAddr.pincode) {
      const saved = await saveAddr();
      if (saved) {
        setStep(2);
        return;
      }
    }

    // 3. If there are saved addresses available, pick the default or first one
    if (addresses.length > 0) {
      const first = addresses.find(a => a.is_default) || addresses[0];
      setSelectedAddr(first);
      setStep(2);
      return;
    }

    // 4. If GPS was captured, use it as delivery address
    if (location) {
      const gpsAddr = {
        id: 'gps_' + Date.now(),
        label: 'GPS Location',
        house: '',
        street: location.label || 'Delivery Location',
        area: '',
        city: newAddr.city || 'Bengaluru',
        state: 'Karnataka',
        pincode: newAddr.pincode || '560001'
      };
      setSelectedAddr(gpsAddr);
      setStep(2);
      return;
    }

    toast.error('Please enter or select a delivery address');
  };

  const placeOrder = async () => {
    let orderAddress = selectedAddr;
    if (!orderAddress) {
      if (newAddr.street || newAddr.city || newAddr.pincode) {
        orderAddress = await saveAddr();
      } else if (addresses.length > 0) {
        orderAddress = addresses.find(a => a.is_default) || addresses[0];
        setSelectedAddr(orderAddress);
      }
    }

    if (!orderAddress) {
      toast.error('Please enter a delivery address');
      setStep(1);
      return;
    }
    if (!cart.items?.length) { toast.error('Cart is empty'); return; }
    setPlacing(true);
    try {
      const payload = {
        address_id: typeof orderAddress.id === 'number' ? orderAddress.id : null,
        delivery_address: orderAddress,
        payment_method: payMethod,
        phone: phone,
      };
      if (location) {
        payload.delivery_lat = location.lat;
        payload.delivery_lng = location.lng;
        payload.delivery_location_label = location.label;
      }
      const res = await api.post('/orders', payload);
      await fetchCart();
      navigate(`/order-confirm/${res.data.order_id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally { setPlacing(false); }
  };

  const stepLabels = [t(lang, 'customerDetails'), t(lang, 'deliveryAddress'), t(lang, 'orderSummary'), t(lang, 'payment')];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>{t(lang, 'checkout')}</h1>

        {/* Steps */}
        <div className="checkout-steps" style={{ marginBottom: 40, borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {stepLabels.map((label, i) => (
            <div key={i} className={`step ${i === step ? 'active' : i < step ? 'done' : ''}`}>
              <div className="step-num">{i < step ? <Check size={14} /> : i + 1}</div>
              <div className="step-label">{label}</div>
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          <div>
            {/* Step 0: Customer Details */}
            {step === 0 && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'customerDetails')}</h3></div>
                <div className="card-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div className="form-group">
                      <label className="form-label">{t(lang, 'fullName')}</label>
                      <input className="form-input" value={user?.full_name || ''} readOnly />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t(lang, 'mobile')} *</label>
                      <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Enter 10-digit mobile number" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1/-1' }}>
                      <label className="form-label">{t(lang, 'email')}</label>
                      <input className="form-input" value={user?.email || ''} readOnly />
                    </div>
                  </div>
                </div>
                <div className="card-footer" style={{ justifyContent: 'flex-end', display: 'flex' }}>
                  <button className="btn btn-primary" onClick={() => {
                    if (!phone || phone.replace(/\D/g, '').length < 10) {
                      toast.error('Please enter a valid 10-digit mobile number');
                      return;
                    }
                    setStep(1);
                  }}>{t(lang, 'next')} <ChevronRight size={16} /></button>
                </div>
              </div>
            )}

            {/* Step 1: Delivery Address + GPS */}
            {step === 1 && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'deliveryAddress')}</h3></div>
                <div className="card-body">
                  {addresses.length > 0 && (
                    <div style={{ marginBottom: 20 }}>
                      <p style={{ fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)', fontSize: 13, textTransform: 'uppercase' }}>{t(lang, 'savedAddresses')}</p>
                      {addresses.map(addr => {
                        const isSelected = selectedAddr?.id === addr.id || (selectedAddr && !selectedAddr.id && selectedAddr.street === addr.street);
                        return (
                          <div key={addr.id}
                            onClick={() => { setSelectedAddr(addr); setAddingAddr(false); }}
                            style={{
                              padding: 16, marginBottom: 12,
                              border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                              borderRadius: 'var(--radius)', cursor: 'pointer',
                              background: isSelected ? 'rgba(194,68,15,0.06)' : 'var(--surface-2)',
                              transition: 'all 0.2s'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ fontWeight: 700, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                                  <Home size={14} /> {addr.label || 'Delivery Address'}
                                  {addr.is_default ? <span className="badge badge-primary" style={{ fontSize: 10 }}>Default</span> : null}
                                  {isSelected && <span className="badge" style={{ fontSize: 10, background: 'var(--primary)', color: '#fff' }}>Selected ✓</span>}
                                </div>
                                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                                  {[addr.house, addr.street, addr.area, addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                                </p>
                              </div>
                              {isSelected ? (
                                <Check size={20} color="var(--primary)" style={{ strokeWidth: 3 }} />
                              ) : (
                                <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid var(--border)' }} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {addresses.length > 0 && (
                    <button className="btn btn-secondary btn-sm" onClick={() => setAddingAddr(!addingAddr)} style={{ marginBottom: 16 }}>
                      <Plus size={14} /> {addingAddr ? 'Close Address Form' : t(lang, 'addNewAddress')}
                    </button>
                  )}

                  {(addresses.length === 0 || addingAddr) && (
                    <div style={{ background: 'var(--surface-2)', padding: 20, borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: 20 }}>
                      <h4 style={{ fontWeight: 700, marginBottom: 14, fontSize: 14, color: 'var(--text-primary)' }}>
                        {addresses.length === 0 ? '📍 Enter Delivery Address' : '📍 Add New Delivery Address'}
                      </h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {[
                          { key: 'house', label: t(lang, 'house'), placeholder: 'e.g. Site #12 / Plot 4' },
                          { key: 'street', label: t(lang, 'street'), placeholder: 'e.g. Ring Road' },
                          { key: 'area', label: t(lang, 'area'), placeholder: 'e.g. Industrial Area' },
                          { key: 'city', label: t(lang, 'city'), placeholder: 'e.g. Bengaluru' },
                          { key: 'state', label: t(lang, 'state'), placeholder: 'e.g. Karnataka' },
                          { key: 'pincode', label: t(lang, 'pincode'), placeholder: 'e.g. 560001' },
                        ].map(({ key, label, placeholder }) => (
                          <div key={key} className="form-group">
                            <label className="form-label">{label}</label>
                            <input
                              className="form-input"
                              value={newAddr[key]}
                              placeholder={placeholder}
                              onChange={e => {
                                const val = e.target.value;
                                setNewAddr(a => {
                                  const updated = { ...a, [key]: val };
                                  setSelectedAddr(updated);
                                  return updated;
                                });
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <button className="btn btn-primary btn-sm" onClick={saveAddr}>Save & Use Address</button>
                        {addresses.length > 0 && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setAddingAddr(false)}>Cancel</button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 📍 GPS Location Sharing */}
                  <div style={{ background: 'linear-gradient(135deg, rgba(14,165,233,0.08), rgba(34,197,94,0.06))', border: '1.5px solid rgba(14,165,233,0.25)', borderRadius: 'var(--radius)', padding: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <MapPin size={18} color="#0ea5e9" />
                      <span style={{ fontWeight: 700, fontSize: 15 }}>Share Your Delivery Location</span>
                      <span style={{ fontSize: 11, background: 'rgba(14,165,233,0.15)', color: '#0ea5e9', padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>Auto-calculates delivery charge</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
                      Share your GPS location so we can calculate the exact delivery charge based on distance from our factory.
                    </p>

                    {!location ? (
                      <button
                        className="btn btn-secondary"
                        onClick={captureLocation}
                        disabled={locLoading}
                        style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                      >
                        {locLoading ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={16} />}
                        {locLoading ? 'Getting your location...' : '📍 Share My Location'}
                      </button>
                    ) : (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 16px', background: 'rgba(34,197,94,0.08)', borderRadius: 8, border: '1px solid rgba(34,197,94,0.2)', marginBottom: 10 }}>
                          <MapPin size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--success)', marginBottom: 2 }}>Location Captured ✓</div>
                            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{location.label}</div>
                          </div>
                          <button
                            onClick={clearLocation}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
                            title="Remove location"
                          >×</button>
                        </div>
                        {distanceKm !== null && (
                          <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
                            <span style={{ color: 'var(--text-muted)' }}>📏 Distance: <strong style={{ color: 'var(--text-primary)' }}>{distanceKm} km</strong></span>
                            <span style={{ color: 'var(--text-muted)' }}>🚛 Delivery charge: <strong style={{ color: 'var(--primary)' }}>
                              {chargeLoading ? '...' : `₹${deliveryCharge.toLocaleString('en-IN')}`}
                            </strong></span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(0)}>← {t(lang, 'back')}</button>
                  <button className="btn btn-primary" onClick={handleStep1Next}>{t(lang, 'next')} <ChevronRight size={16} /></button>
                </div>
              </div>
            )}

            {/* Step 2: Order Summary */}
            {step === 2 && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'orderSummary')}</h3></div>
                <div className="card-body">
                  <div style={{ marginBottom: 24 }}>
                    {cart.items?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.quantity.toLocaleString('en-IN')} × ₹{item.price}</div>
                        </div>
                        <div style={{ fontWeight: 700 }}>₹{(item.quantity * item.price).toLocaleString('en-IN')}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 'var(--radius)', padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span>{t(lang, 'subtotal')}</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {t(lang, 'deliveryCharge')}
                        {distanceKm && <span style={{ fontSize: 11, color: '#0ea5e9', background: 'rgba(14,165,233,0.1)', padding: '1px 6px', borderRadius: 10 }}>{distanceKm} km</span>}
                      </span>
                      <span>₹{deliveryCharge.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      <span>{t(lang, 'grandTotal')}</span><span style={{ color: 'var(--primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  {selectedAddr && (
                    <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                      <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 13, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Delivery To</p>
                      <p style={{ fontSize: 14 }}>{[selectedAddr.house, selectedAddr.street, selectedAddr.area, selectedAddr.city, selectedAddr.state, selectedAddr.pincode].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {location && (
                    <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(14,165,233,0.06)', borderRadius: 8, border: '1px solid rgba(14,165,233,0.2)', display: 'flex', gap: 8, alignItems: 'center' }}>
                      <MapPin size={14} color="#0ea5e9" />
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>GPS location shared with order</span>
                    </div>
                  )}
                </div>
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(1)}>← {t(lang, 'back')}</button>
                  <button className="btn btn-primary" onClick={() => setStep(3)}>{t(lang, 'next')} <ChevronRight size={16} /></button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 3 && (
              <div className="card">
                <div className="card-header"><h3 className="modal-title">{t(lang, 'payment')}</h3></div>
                <div className="card-body">
                  <div className="payment-methods">
                    {[
                      { id: 'upi', icon: <Smartphone size={24} />, name: t(lang, 'upi'), desc: 'Pay via UPI / Google Pay / PhonePe' },
                      { id: 'card', icon: <CreditCard size={24} />, name: t(lang, 'card'), desc: 'Credit / Debit Card' },
                      { id: 'cod', icon: <Banknote size={24} />, name: t(lang, 'cod'), desc: 'Pay when delivered' },
                      { id: 'bank_transfer', icon: <Building size={24} />, name: t(lang, 'bankTransfer'), desc: 'NEFT / RTGS / IMPS' },
                    ].map(m => (
                      <div key={m.id} className={`payment-method-card ${payMethod === m.id ? 'selected' : ''}`} onClick={() => setPayMethod(m.id)}>
                        <div className="payment-method-icon">{m.icon}</div>
                        <div>
                          <div className="payment-method-name">{m.name}</div>
                          <div className="payment-method-desc">{m.desc}</div>
                        </div>
                        {payMethod === m.id && <Check size={16} color="var(--primary)" style={{ marginLeft: 'auto' }} />}
                      </div>
                    ))}
                  </div>
                  <div className="alert alert-info" style={{ marginTop: 20 }}>
                    <span>ℹ️</span>
                    <span>{t(lang, 'paymentNote')}</span>
                  </div>
                  <div style={{ marginTop: 20, padding: 16, background: 'rgba(194,68,15,0.05)', borderRadius: 'var(--radius)', border: '1px solid rgba(194,68,15,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
                      <span>Delivery{distanceKm ? ` (${distanceKm} km)` : ''}</span><span>₹{deliveryCharge.toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, borderTop: '1px solid rgba(194,68,15,0.2)', paddingTop: 12 }}>
                      <span>{t(lang, 'grandTotal')}</span>
                      <span style={{ color: 'var(--primary)' }}>₹{total.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
                <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button className="btn btn-ghost" onClick={() => setStep(2)}>← {t(lang, 'back')}</button>
                  <button className="btn btn-primary btn-lg" onClick={placeOrder} disabled={placing}>
                    {placing ? 'Placing Order...' : `🧱 ${t(lang, 'placeOrder')}`}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order mini-summary sidebar */}
          <div>
            <div className="cart-summary">
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Order Details</h3>
              {cart.items?.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.name} × {item.quantity.toLocaleString('en-IN')}</span>
                  <span>₹{(item.quantity * item.price).toLocaleString('en-IN')}</span>
                </div>
              ))}
              <hr className="divider" />
              <div className="cart-summary-row">
                <span>{t(lang, 'subtotal')}</span><span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="cart-summary-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {t(lang, 'deliveryCharge')}
                  {location && <MapPin size={12} color="#0ea5e9" />}
                </span>
                <span>{chargeLoading ? '...' : `₹${deliveryCharge.toLocaleString('en-IN')}`}</span>
              </div>
              {distanceKm && (
                <div style={{ fontSize: 11, color: '#0ea5e9', textAlign: 'right', marginTop: -6, marginBottom: 4 }}>
                  📏 {distanceKm} km from factory
                </div>
              )}
              <div className="cart-summary-row">
                <strong style={{ fontSize: 18 }}>{t(lang, 'grandTotal')}</strong>
                <span className="cart-summary-total">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
