import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { t } from '../translations';
import { LoadingPage, EmptyState } from '../components/utils';
import toast from 'react-hot-toast';

export default function CartPage() {
  const { lang } = useLang();
  const { cart, loading, updateQty, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

  const DELIVERY_CHARGE = 1500;
  const subtotal = cart.items?.reduce((s, i) => s + i.quantity * i.price, 0) || 0;
  const total = subtotal + DELIVERY_CHARGE;

  const handleQty = async (item, delta) => {
    const step = item.min_order_qty || 100;
    const newQty = item.quantity + delta * step;
    if (newQty < (item.min_order_qty || 1)) return;
    if (newQty > item.available_stock) { toast.error('Not enough stock'); return; }
    try { await updateQty(item.id, newQty); }
    catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  const handleRemove = async (itemId) => {
    await removeItem(itemId);
    toast.success('Item removed');
  };

  const handleClear = async () => {
    if (window.confirm('Clear entire cart?')) { await clearCart(); toast.success('Cart cleared'); }
  };

  if (loading) return <div className="page"><LoadingPage /></div>;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>{t(lang, 'yourCart')}</h1>
          {cart.items?.length > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}><Trash2 size={14} /> {t(lang, 'clearCart')}</button>
          )}
        </div>

        {!cart.items?.length ? (
          <EmptyState
            icon="🛒"
            title={t(lang, 'emptyCart')}
            desc={t(lang, 'emptyCartSub')}
            action={<Link to="/products" className="btn btn-primary">{t(lang, 'continueShopping')}</Link>}
          />
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {cart.items.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-img">
                    {item.image
                      ? <img src={`http://localhost:5000${item.image}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🧱</div>
                    }
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {lang === 'kn' && item.name_kn ? item.name_kn : item.name}
                    </div>
                    {item.name_kn && lang === 'en' && <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{item.name_kn}</div>}
                    <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
                      ₹{item.price} / {item.unit}
                    </div>
                    {item.quantity > item.available_stock && (
                      <div style={{ fontSize: 12, color: 'var(--error)', marginTop: 4 }}>⚠ Only {item.available_stock?.toLocaleString('en-IN')} available</div>
                    )}
                  </div>

                  {/* Qty control */}
                  <div className="qty-control" style={{ margin: '0' }}>
                    <button className="qty-btn" onClick={() => handleQty(item, -1)}><Minus size={14} /></button>
                    <input type="number" className="qty-input" value={item.quantity} style={{ width: 90 }}
                      onChange={e => {
                        const v = parseInt(e.target.value);
                        if (!isNaN(v) && v >= item.min_order_qty && v <= item.available_stock) updateQty(item.id, v);
                      }}
                    />
                    <button className="qty-btn" onClick={() => handleQty(item, 1)}><Plus size={14} /></button>
                  </div>

                  {/* Subtotal */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--primary)' }}>
                      ₹{(item.quantity * item.price).toLocaleString('en-IN')}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {item.quantity.toLocaleString('en-IN')} × ₹{item.price}
                    </div>
                  </div>

                  {/* Remove */}
                  <button className="btn btn-ghost btn-icon" onClick={() => handleRemove(item.id)} style={{ color: 'var(--error)' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="cart-summary">
              <h3 style={{ fontWeight: 800, marginBottom: 20 }}>Order Summary</h3>
              <div className="cart-summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>{t(lang, 'subtotal')}</span>
                <span style={{ fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="cart-summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>{t(lang, 'deliveryCharge')}</span>
                <span style={{ fontWeight: 600 }}>₹{DELIVERY_CHARGE.toLocaleString('en-IN')}</span>
              </div>
              <div className="cart-summary-row" style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 800, fontSize: 18 }}>{t(lang, 'grandTotal')}</span>
                <span className="cart-summary-total">₹{total.toLocaleString('en-IN')}</span>
              </div>

              <button
                className="btn btn-primary btn-lg"
                style={{ width: '100%', marginTop: 24 }}
                onClick={() => navigate('/checkout')}
              >
                {t(lang, 'proceedToCheckout')} <ArrowRight size={18} />
              </button>
              <Link to="/products" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 8, justifyContent: 'center' }}>
                ← {t(lang, 'continueShopping')}
              </Link>

              <div style={{ marginTop: 20, padding: 16, background: 'var(--surface-2)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-muted)' }}>
                {cart.items?.length} item type{cart.items?.length !== 1 ? 's' : ''} in cart
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
