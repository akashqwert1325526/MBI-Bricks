import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart } from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { t } from '../translations';
import { EmptyState } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

export default function WishlistPage() {
  const { lang } = useLang();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/settings/wishlist').then(r => setItems(r.data)).finally(() => setLoading(false));
  }, []);

  const remove = async (productId) => {
    await api.delete(`/settings/wishlist/${productId}`);
    setItems(i => i.filter(x => x.product_id !== productId));
    toast.success('Removed from wishlist');
  };

  const addCart = async (item) => {
    try {
      await addToCart(item.product_id, item.min_order_qty || 500);
      toast.success('Added to cart!');
    } catch (err) { toast.error(err.response?.data?.error || 'Error'); }
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 60 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>
          <Heart size={24} style={{ marginRight: 12, color: 'var(--error)', display: 'inline' }} />
          {t(lang, 'wishlist')}
        </h1>
        {!items.length ? (
          <EmptyState icon="❤️" title="Your wishlist is empty" desc="Save bricks you like for later"
            action={<Link to="/products" className="btn btn-primary">Browse Products</Link>} />
        ) : (
          <div className="product-grid">
            {items.map(item => (
              <div key={item.id} className="product-card">
                <div className="product-card-img">
                  {item.image ? <img src={`http://localhost:5000${item.image}`} alt={item.name} /> :
                    <div className="product-card-img-placeholder"><span style={{ fontSize: 48 }}>🧱</span></div>}
                  <button className="product-wishlist active" onClick={() => remove(item.product_id)}>
                    <Heart size={16} fill="#ef4444" />
                  </button>
                </div>
                <div className="product-card-body">
                  <div className="product-name">{item.name}</div>
                  <div className="product-name-kn">{item.name_kn}</div>
                  <div className="product-price">₹{item.price} <span>/ {item.unit}</span></div>
                </div>
                <div className="product-card-footer">
                  <Link to={`/product/${item.product_id}`} className="btn btn-secondary btn-sm" style={{ flex: 1 }}>View</Link>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => addCart(item)} disabled={!item.is_available || !item.stock}>
                    <ShoppingCart size={14} /> {t(lang, 'addToCart')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
