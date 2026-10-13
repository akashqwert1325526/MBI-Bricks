import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingCart, Eye, Heart, Search, SlidersHorizontal } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { t } from '../translations';
import { LoadingPage, EmptyState } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

function BrickImage({ src, name }) {
  if (src) {
    return (
      <img
        src={`http://localhost:5000${src}`}
        alt={name}
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
      />
    );
  }
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, background: 'var(--surface-2)' }}>
      🧱
    </div>
  );
}

export default function ProductsPage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [sort, setSort] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    api.get('/products/categories/all').then(r => setCategories(r.data)).catch(() => {});
    if (user?.role === 'customer') {
      api.get('/settings/wishlist').then(r => setWishlist(r.data.map(i => i.product_id))).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    if (sort) params.set('sort', sort);
    if (availableOnly) params.set('available', 'true');
    api.get(`/products?${params}`).then(r => setProducts(r.data)).finally(() => setLoading(false));
  }, [search, category, sort, availableOnly]);

  const handleAddToCart = async (product) => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'customer') return;
    try {
      await addToCart(product.id, product.min_order_qty || 500);
      toast.success(`Added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) { navigate('/login'); return; }
    if (wishlist.includes(productId)) {
      await api.delete(`/settings/wishlist/${productId}`);
      setWishlist(w => w.filter(id => id !== productId));
    } else {
      await api.post('/settings/wishlist', { product_id: productId });
      setWishlist(w => [...w, productId]);
    }
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32 }}>
        {/* Page Header */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>{t(lang, 'products')}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            {lang === 'kn' ? 'ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಇಟ್ಟಿಗೆಗಳು' : 'Premium quality bricks for all construction needs'}
          </p>
        </div>

        {/* Filter Bar */}
        <div className="filter-bar" style={{ marginBottom: 32 }}>
          <div className="search-bar" style={{ flex: 1, minWidth: 200 }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t(lang, 'searchProducts')}
            />
          </div>

          <select
            className="form-input form-select"
            style={{ width: 180 }}
            value={category}
            onChange={e => setCategory(e.target.value)}
          >
            <option value="">{t(lang, 'allCategories')}</option>
            {categories.map(c => (
              <option key={c.id} value={c.slug}>{c.name}</option>
            ))}
          </select>

          <select
            className="form-input form-select"
            style={{ width: 180 }}
            value={sort}
            onChange={e => setSort(e.target.value)}
          >
            <option value="">{t(lang, 'sortBy')}</option>
            <option value="price_asc">{t(lang, 'priceLow')}</option>
            <option value="price_desc">{t(lang, 'priceHigh')}</option>
            <option value="newest">{t(lang, 'newest')}</option>
          </select>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={availableOnly} onChange={e => setAvailableOnly(e.target.checked)} />
            {t(lang, 'inStockOnly')}
          </label>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          <button className={`chip ${!category ? 'active' : ''}`} onClick={() => setCategory('')}>{t(lang, 'allCategories')}</button>
          {categories.map(c => (
            <button key={c.id} className={`chip ${category === c.slug ? 'active' : ''}`} onClick={() => setCategory(c.slug)}>
              🧱 {lang === 'kn' && c.name_kn ? c.name_kn : c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? <LoadingPage /> : products.length === 0 ? (
          <EmptyState icon="🔍" title={t(lang, 'noProductsFound')} desc="Try a different search or category" />
        ) : (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 20 }}>{products.length} product{products.length !== 1 ? 's' : ''} found</p>
            <div className="product-grid">
              {products.map(product => {
                const name = lang === 'kn' && product.name_kn ? product.name_kn : product.name;
                const inStock = product.stock > 0 && product.is_available;
                return (
                  <div key={product.id} className="product-card">
                    <div className="product-card-img">
                      <BrickImage src={product.image} name={product.name} />
                      {inStock
                        ? <span className="product-badge product-badge-stock">{t(lang, 'inStock')}</span>
                        : <span className="product-badge product-badge-out">{t(lang, 'outOfStock')}</span>
                      }
                      <button className={`product-wishlist ${wishlist.includes(product.id) ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)}>
                        <Heart size={16} fill={wishlist.includes(product.id) ? '#ef4444' : 'none'} />
                      </button>
                    </div>
                    <div className="product-card-body">
                      <div className="product-name">{product.name}</div>
                      <div className="product-name-kn">{product.name_kn}</div>
                      <div className="product-price">₹{product.price} <span>/ {product.unit}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        <span>{t(lang, 'availableStock')}: {(product.inventory_stock || product.stock || 0).toLocaleString('en-IN')}</span>
                        <span>Min: {(product.min_order_qty || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="product-card-footer">
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/product/${product.id}`)}><Eye size={14} /> {t(lang, 'viewDetails')}</button>
                      <button className="btn btn-primary btn-sm" onClick={() => handleAddToCart(product)} disabled={!inStock}>
                        <ShoppingCart size={14} /> {t(lang, 'addToCart')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
