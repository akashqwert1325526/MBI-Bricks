import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingCart, Heart, ChevronLeft, Plus, Minus, Package } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { t } from '../translations';
import { LoadingPage } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { lang } = useLang();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(500);
  const [wishlisted, setWishlisted] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    api.get(`/products/${id}`).then(r => {
      setProduct(r.data);
      setQty(r.data.min_order_qty || 500);
    }).catch(() => navigate('/products')).finally(() => setLoading(false));
    if (user?.role === 'customer') {
      api.get('/settings/wishlist').then(r => {
        setWishlisted(r.data.some(i => i.product_id === parseInt(id)));
      }).catch(() => {});
    }
  }, [id, user]);

  const handleQty = (delta) => {
    const step = product?.min_order_qty || 100;
    setQty(q => Math.max(product?.min_order_qty || 1, q + delta * step));
  };

  const handleAddToCart = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'customer') return;
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    } finally { setAdding(false); }
  };

  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    await handleAddToCart();
    navigate('/checkout');
  };

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    if (wishlisted) {
      await api.delete(`/settings/wishlist/${id}`);
      setWishlisted(false);
      toast.success('Removed from wishlist');
    } else {
      await api.post('/settings/wishlist', { product_id: id });
      setWishlisted(true);
      toast.success('Added to wishlist!');
    }
  };

  if (loading) return <div className="page"><LoadingPage /></div>;
  if (!product) return null;

  const inStock = product.stock > 0 && product.is_available;
  const name = lang === 'kn' && product.name_kn ? product.name_kn : product.name;
  const desc = lang === 'kn' && product.description_kn ? product.description_kn : product.description;
  const totalPrice = (qty * product.price).toLocaleString('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 });
  const availStock = product.inventory_stock !== undefined ? product.inventory_stock : product.stock;

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <Link to="/products" className="back-link"><ChevronLeft size={18} /> {t(lang, 'products')}</Link>

        <div className="product-detail-grid">
          {/* Left - Image */}
          <div>
            <div className="product-detail-img">
              {product.image
                ? <img src={`http://localhost:5000${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--surface-2), var(--surface-3))', gap: 12 }}>
                    <span style={{ fontSize: 80 }}>🧱</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: 16 }}>{product.name}</span>
                  </div>
              }
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 20, marginTop: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16 }}>{t(lang, 'specifications')}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  ['Category', product.category_name],
                  ['Unit', product.unit],
                  ['Min Order Qty', `${(product.min_order_qty || 0).toLocaleString('en-IN')} pieces`],
                  ['Available Stock', `${(availStock || 0).toLocaleString('en-IN')} pieces`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                    <span style={{ fontWeight: 600 }}>{v || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right - Details */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <span style={{ background: 'rgba(194,68,15,0.1)', color: 'var(--primary)', border: '1px solid rgba(194,68,15,0.3)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 700 }}>
                {product.category_name}
              </span>
              <button className={`product-wishlist ${wishlisted ? 'active' : ''}`} onClick={toggleWishlist} style={{ position: 'static', width: 40, height: 40 }}>
                <Heart size={18} fill={wishlisted ? '#ef4444' : 'none'} />
              </button>
            </div>

            <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 6 }}>{product.name}</h1>
            {product.name_kn && <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 20 }}>{product.name_kn}</p>}

            {/* Price */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 24 }}>
              <span className="price-tag">₹{product.price}</span>
              <span className="price-unit">/ {product.unit}</span>
            </div>

            {/* Stock status */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              {inStock ? (
                <span className="badge badge-success">✓ {t(lang, 'inStock')} — {availStock?.toLocaleString('en-IN')} pieces</span>
              ) : (
                <span className="badge badge-error">✗ {t(lang, 'outOfStock')}</span>
              )}
              <span className="badge badge-neutral">{t(lang, 'minOrder')}: {(product.min_order_qty || 0).toLocaleString('en-IN')} pcs</span>
            </div>

            {/* Description */}
            {desc && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 10 }}>{t(lang, 'description')}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: 15 }}>{desc}</p>
              </div>
            )}

            {/* Qty selector */}
            {inStock && (
              <div style={{ marginBottom: 28 }}>
                <label style={{ display: 'block', fontWeight: 700, marginBottom: 12 }}>{t(lang, 'quantity')}</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div className="qty-control">
                    <button className="qty-btn" onClick={() => handleQty(-1)}><Minus size={16} /></button>
                    <input
                      type="number" className="qty-input" value={qty}
                      onChange={e => setQty(Math.max(product.min_order_qty || 1, parseInt(e.target.value) || 0))}
                    />
                    <button className="qty-btn" onClick={() => handleQty(1)}><Plus size={16} /></button>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total</div>
                    <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--accent)' }}>{totalPrice}</div>
                  </div>
                </div>
                {qty > availStock && <p style={{ color: 'var(--error)', fontSize: 12, marginTop: 8 }}>⚠ Exceeds available stock ({availStock?.toLocaleString('en-IN')} pieces)</p>}
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {inStock ? (
                <>
                  <button className="btn btn-primary btn-lg" onClick={handleAddToCart} disabled={adding || qty > availStock} style={{ flex: 1 }}>
                    <ShoppingCart size={20} /> {adding ? 'Adding...' : t(lang, 'addToCart')}
                  </button>
                  <button className="btn btn-accent btn-lg" onClick={handleBuyNow} disabled={qty > availStock} style={{ flex: 1 }}>
                    {t(lang, 'buyNow')}
                  </button>
                </>
              ) : (
                <button className="btn btn-secondary btn-lg" disabled style={{ flex: 1 }}>
                  <Package size={20} /> {t(lang, 'outOfStock')}
                </button>
              )}
            </div>

            {/* Delivery note */}
            <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--surface-2)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                🚛 Delivery available across Karnataka. Delivery charge calculated at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
