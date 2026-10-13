import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Eye, Heart, Star, Truck, Shield, Factory, MapPin,
  ShieldCheck, Leaf, Headset, ArrowRight, LayoutGrid, Award, Users,
  Calculator, CheckCircle, Phone, MessageCircle, Navigation, ExternalLink
} from 'lucide-react';
import { useLang } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { t } from '../translations';
import { formatPrice, BrickImage, LoadingPage } from '../components/utils';
import api from '../api';
import toast from 'react-hot-toast';

export default function HomePage() {
  const { lang } = useLang();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState([]);

  // Brick Calculator State
  const [calcLength, setCalcLength] = useState(10);
  const [calcHeight, setCalcHeight] = useState(10);
  const [calcThickness, setCalcThickness] = useState(9); // 4.5 or 9 inch wall

  useEffect(() => {
    Promise.all([
      api.get('/products?available=true'),
      api.get('/products/categories/all'),
    ]).then(([p, c]) => {
      setProducts(p.data);
      setCategories(c.data);
    }).catch(() => {}).finally(() => setLoading(false));

    if (user?.role === 'customer') {
      api.get('/settings/wishlist').then(r => setWishlist(r.data.map(i => i.product_id))).catch(() => {});
    }
  }, [user]);

  const handleAddToCart = async (product) => {
    if (!user) { navigate('/login'); return; }
    try {
      await addToCart(product.id, product.min_order_qty || 500);
      toast.success(`${lang === 'kn' ? product.name_kn || product.name : product.name} added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add to cart');
    }
  };

  const wirecutProduct = products.find(p => p.category === 'wirecut' || p.name?.toLowerCase().includes('wirecut')) || { id: 1, price: 9 };
  const tableMouldProduct = products.find(p => p.category === 'table_mould' || p.name?.toLowerCase().includes('table')) || { id: 2, price: 8 };

  // Calculate bricks needed
  const wallAreaSqFt = (Number(calcLength) || 0) * (Number(calcHeight) || 0);
  const bricksPerSqFt = calcThickness === 9 ? 9 : 4.5;
  const estimatedBricks = Math.ceil(wallAreaSqFt * bricksPerSqFt * 1.05); // 5% wastage

  return (
    <div style={{ background: '#faf8f5', minHeight: '100vh', color: '#1c1917' }}>
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '96px 24px 60px' }}>

        {/* ─── 1. HERO SECTION (EXACT MATCH TO SCREENSHOT) ─── */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1.05fr 1fr',
          gap: 36,
          alignItems: 'center',
          marginBottom: 36,
          paddingTop: 16
        }}>
          {/* Left Column: Headline, Description, CTAs, Badges */}
          <div style={{ paddingRight: 12 }}>
            {/* Top Accent Tag: Orange line + TRUSTED BRICK MANUFACTURER */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              color: '#c2410c',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              marginBottom: 16
            }}>
              <span style={{ width: 26, height: 2.5, background: '#c2410c', borderRadius: 2 }} />
              <span>{lang === 'kn' ? 'TRUSTED BRICK MANUFACTURER' : t(lang, 'trustedManufacturer')}</span>
            </div>

            {/* Main Headline matching image */}
            <h1 style={{
              fontSize: 'clamp(2.5rem, 4.4vw, 3.8rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: '#1c1917',
              marginBottom: 20,
              letterSpacing: '-0.5px'
            }}>
              <div>{lang === 'kn' ? 'ನಮ್ಮ ನಿರ್ಮಾಣಕ್ಕೆ' : t(lang, 'heroLine1')}</div>
              <div style={{ color: '#c2410c' }}>{lang === 'kn' ? 'ಉತ್ತಮ ಇಟ್ಟಿಗೆಗಳು' : t(lang, 'heroLine2')}</div>
            </h1>

            {/* Description matching image */}
            <p style={{
              fontSize: 16,
              color: '#57534e',
              lineHeight: 1.65,
              maxWidth: 520,
              marginBottom: 30
            }}>
              {lang === 'kn'
                ? 'MBI ಬ್ರಿಕ್ಸ್ ಇಂಡಸ್ಟ್ರೀಯಲ್ಲಿ ಉತ್ತಮ ಗುಣಮಟ್ಟದ ಇಟ್ಟಿಗೆಗಳನ್ನು ತಯಾರಿಸಿ ನಿಮ್ಮ ನಿರ್ಮಾಣ ಕನಸುಗಳನ್ನು ನನಸು ಮಾಡಲು ಸಹಾಯ ಮಾಡುತ್ತೇವೆ.'
                : t(lang, 'heroDesc')
              }
            </p>

            {/* Call To Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
              {/* Button 1: Solid orange rounded pill button */}
              <Link
                to="/products"
                style={{
                  background: '#c2410c',
                  color: '#ffffff',
                  padding: '13px 26px',
                  borderRadius: 9999,
                  fontWeight: 800,
                  fontSize: 15,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(194, 65, 12, 0.28)',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* 3 stacked mini bricks SVG icon */}
                <svg width="20" height="15" viewBox="0 0 20 15" fill="none">
                  <rect x="0" y="0" width="5.5" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="7" y="0" width="6" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="14.5" y="0" width="5.5" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="0" y="4.5" width="9.5" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="10.5" y="4.5" width="9.5" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="0" y="9" width="5.5" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="7" y="9" width="6" height="3" rx="0.8" fill="#ffffff" />
                  <rect x="14.5" y="9" width="5.5" height="3" rx="0.8" fill="#ffffff" />
                </svg>
                <span>{lang === 'kn' ? 'ಬುಕ್ ಮಾಡಿ' : t(lang, 'bookBricks')}</span>
                <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 2 }}>→</span>
              </Link>

              {/* Button 2: White rounded pill with dark border */}
              <Link
                to="/products"
                style={{
                  border: '1.5px solid #292524',
                  background: '#ffffff',
                  color: '#1c1917',
                  padding: '13px 26px',
                  borderRadius: 9999,
                  fontWeight: 800,
                  fontSize: 15,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  textDecoration: 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{lang === 'kn' ? 'ನಮ್ಮ ಉತ್ಪನ್ನಗಳು' : t(lang, 'ourProducts')}</span>
                <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 2 }}>→</span>
              </Link>
            </div>

            {/* Trust Badges matching image */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', paddingTop: 8 }}>
              {/* Badge 1: Quality Tested */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#ffedd5',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <ShieldCheck size={18} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1917' }}>
                  Quality Tested
                </span>
              </div>

              {/* Badge 2: Reliable Delivery */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#ffedd5',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Truck size={17} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1917' }}>
                  Reliable Delivery
                </span>
              </div>

              {/* Badge 3: Direct From Factory */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  background: '#ffedd5',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Factory size={17} />
                </div>
                <span style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1917' }}>
                  Direct From Factory
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual with stacked bricks & floating Wirecut card */}
          <div style={{ position: 'relative' }}>
            <div style={{
              width: '100%',
              height: 420,
              borderRadius: 26,
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 12px 36px rgba(0,0,0,0.06)',
              background: '#e5e5e5'
            }}>
              <img
                src="/hero-bricks.jpg"
                alt="MBI Bricks Construction Site"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />

              {/* Floating Wirecut Card matching screenshot (bottom right) */}
              <div style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                background: '#ffffff',
                borderRadius: 16,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 12px 30px rgba(0,0,0,0.14)',
                border: '1px solid rgba(0,0,0,0.06)',
                zIndex: 10,
                maxWidth: 320
              }}>
                <img
                  src="/wirecut-brick.jpg"
                  alt="Wirecut Brick"
                  style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#1c1917' }}>
                    Wirecut Bricks
                  </div>
                  <div style={{ fontSize: 11, color: '#78716c', margin: '2px 0 4px' }}>
                    {lang === 'kn' ? 'ಉತ್ತಮ ಗುಣಮಟ್ಟದ ವೈರ್‌ಕಟ್ ಇಟ್ಟಿಗೆಗಳು' : 'Superior Quality Wirecut Bricks'}
                  </div>
                  <Link
                    to="/products"
                    style={{ fontSize: 12, fontWeight: 800, color: '#c2410c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  >
                    View details →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 2. PRODUCT CARDS GRID (EXACT MATCH TO SCREENSHOT) ─── */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 24,
          marginBottom: 48
        }}>
          {/* Card 1: Wirecut Bricks */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e7e5e4',
            borderRadius: 20,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            transition: 'all 0.25s ease'
          }}>
            <img
              src="/wirecut-brick.jpg"
              alt="Wirecut Bricks"
              style={{
                width: 190,
                height: 125,
                objectFit: 'cover',
                borderRadius: 14,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1c1917', marginBottom: 6 }}>
                Wirecut Bricks
              </h3>
              <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.45, marginBottom: 12 }}>
                {lang === 'kn'
                  ? 'ಉತ್ತಮ ಬಲಿ ಮತ್ತು ದೀರ್ಘಕಾಲಿಕತೆ ಹೊಂದಿರುವ ವೈರ್‌ಕಟ್ ಇಟ್ಟಿಗೆಗಳು.'
                  : t(lang, 'wirecutShortDesc')
                }
              </p>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#c2410c' }}>
                ₹ — <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>/ brick</span>
              </div>
            </div>
            <Link
              to="/products"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#c2410c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 'auto',
                boxShadow: '0 4px 14px rgba(194, 65, 12, 0.35)',
                textDecoration: 'none'
              }}
              title="View Wirecut Bricks"
            >
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Card 2: Table Mould Bricks */}
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e7e5e4',
            borderRadius: 20,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
            transition: 'all 0.25s ease'
          }}>
            <img
              src="/table-mould-brick.jpg"
              alt="Table Mould Bricks"
              style={{
                width: 190,
                height: 125,
                objectFit: 'cover',
                borderRadius: 14,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#1c1917', marginBottom: 6 }}>
                Table Mould Bricks
              </h3>
              <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.45, marginBottom: 12 }}>
                {lang === 'kn'
                  ? 'ಸಾಂಪ್ರದಾಯಿಕ ನಿರ್ಮಾಣಕ್ಕಾಗಿ ಸೂಕ್ತವಾದ ಟೇಬಲ್ ಮೌಲ್ಡ್ ಇಟ್ಟಿಗೆಗಳು.'
                  : t(lang, 'tableMouldShortDesc')
                }
              </p>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#c2410c' }}>
                ₹ — <span style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>/ brick</span>
              </div>
            </div>
            <Link
              to="/products"
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: '#c2410c',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                marginLeft: 'auto',
                boxShadow: '0 4px 14px rgba(194, 65, 12, 0.35)',
                textDecoration: 'none'
              }}
              title="View Table Mould Bricks"
            >
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>

        {/* ─── 3. INTERACTIVE BRICK ESTIMATOR / CALCULATOR ─── */}
        <section style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '36px 40px',
          border: '1.5px solid #e7e5e4',
          marginBottom: 48,
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 36, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#c2410c', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
                <Calculator size={16} />
                <span>{lang === 'kn' ? 'ಇಟ್ಟಿಗೆ ಅಂದಾಜು ಲೆಕ್ಕಾಚಾರ' : 'CONSTRUCTION BRICK CALCULATOR'}</span>
              </div>
              <h2 style={{ fontSize: 26, fontWeight: 900, color: '#1c1917', marginBottom: 10 }}>
                {lang === 'kn' ? 'ನಿಮ್ಮ ಗೋಡೆಗೆ ಎಷ್ಟು ಇಟ್ಟಿಗೆಗಳು ಬೇಕು?' : 'How many bricks do you need for your wall?'}
              </h2>
              <p style={{ fontSize: 14, color: '#57534e', marginBottom: 24 }}>
                {lang === 'kn'
                  ? 'ನಿಮ್ಮ ಗೋಡೆಯ ಉದ್ದ ಮತ್ತು ಎತ್ತರವನ್ನು ನಮೂದಿಸಿ ತಕ್ಷಣ ಅಗತ್ಯವಿರುವ ಇಟ್ಟಿಗೆಗಳ ಅಂದಾಜು ಸಂಖ್ಯೆಯನ್ನು ಪಡೆಯಿರಿ.'
                  : 'Enter your wall dimensions to instantly calculate the estimated number of bricks required including standard 5% wastage.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#57534e', display: 'block', marginBottom: 6 }}>
                    {lang === 'kn' ? 'ಗೋಡೆಯ ಉದ್ದ (ಅಡಿ)' : 'Wall Length (Feet)'}
                  </label>
                  <input
                    type="number"
                    value={calcLength}
                    onChange={e => setCalcLength(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e7e5e4', fontSize: 15, fontWeight: 700, color: '#1c1917' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#57534e', display: 'block', marginBottom: 6 }}>
                    {lang === 'kn' ? 'ಗೋಡೆಯ ಎತ್ತರ (ಅಡಿ)' : 'Wall Height (Feet)'}
                  </label>
                  <input
                    type="number"
                    value={calcHeight}
                    onChange={e => setCalcHeight(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e7e5e4', fontSize: 15, fontWeight: 700, color: '#1c1917' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#57534e', display: 'block', marginBottom: 6 }}>
                    {lang === 'kn' ? 'ಗೋಡೆಯ ದಪ್ಪ' : 'Wall Thickness'}
                  </label>
                  <select
                    value={calcThickness}
                    onChange={e => setCalcThickness(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #e7e5e4', fontSize: 14, fontWeight: 700, color: '#1c1917', background: '#fff' }}
                  >
                    <option value={9}>9-inch (Double brick)</option>
                    <option value={4.5}>4.5-inch (Single partition)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Result card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(194,65,12,0.06), rgba(245,158,11,0.08))',
              border: '2px solid rgba(194,65,12,0.25)',
              borderRadius: 20,
              padding: '28px 32px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>
                {lang === 'kn' ? 'ಅಂದಾಜು ಇಟ್ಟಿಗೆಗಳ ಸಂಖ್ಯೆ' : 'Estimated Requirement'}
              </div>
              <div style={{ fontSize: 44, fontWeight: 900, color: '#c2410c', lineHeight: 1.1, marginBottom: 6 }}>
                {estimatedBricks.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: 13, color: '#78716c', marginBottom: 20 }}>
                {lang === 'kn' ? 'ಕಲ್ಲುಗಳು (೫% ವೇಸ್ಟೇಜ್ ಸೇರಿಸಿ)' : 'Pieces (Includes 5% standard buffer)'}
              </div>

              <Link
                to="/products"
                style={{
                  background: '#c2410c',
                  color: '#ffffff',
                  padding: '12px 24px',
                  borderRadius: 9999,
                  fontWeight: 800,
                  fontSize: 14,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(194,65,12,0.25)'
                }}
              >
                <span>{lang === 'kn' ? 'ಈಗಲೇ ಆರ್ಡರ್ ಮಾಡಿ' : 'Order Now'}</span>
                <span>→</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ─── 4. QUALITY ASSURANCE & WHY CHOOSE US ─── */}
        <section id="quality" style={{ marginBottom: 48 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ color: '#c2410c', fontWeight: 800, fontSize: 13, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              {lang === 'kn' ? 'ಉತ್ತಮ ಗುಣಮಟ್ಟದ ವೈಶಿಷ್ಟ್ಯಗಳು' : 'PREMIUM SPECIFICATIONS'}
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#1c1917' }}>
              {lang === 'kn' ? 'ಏಕೆ MBI ಬ್ರಿಕ್ಸ್ ಆಯ್ಕೆ ಮಾಡಬೇಕು?' : 'Why Choose MBI Bricks?'}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {[
              {
                icon: '🏭',
                title: lang === 'kn' ? 'ನೇರ ಕಾರ್ಖಾನೆ ದರ' : 'Direct From Factory',
                desc: lang === 'kn' ? 'ಯಾವುದೇ ಮಧ್ಯವರ್ತಿಗಳಿಲ್ಲದೆ ನೇರವಾಗಿ ನಮ್ಮ ಕಾರ್ಖಾನೆಯಿಂದಲೇ ಸರಬರಾಜು.' : 'Get original factory pricing directly from our manufacturing unit without middlemen.'
              },
              {
                icon: '🧱',
                title: lang === 'kn' ? 'ಹೆಚ್ಚಿನ ಸಾಂದ್ರತೆ & ಶಕ್ತಿ' : 'Superior Compressive Strength',
                desc: lang === 'kn' ? 'ಉತ್ತಮ ಕಚ್ಚಾ ಮಣ್ಣು ಮತ್ತು ಸುಧಾರಿತ ತಂತ್ರಜ್ಞಾನದಿಂದ ತಯಾರಿಸಿದ ಗಟ್ಟಿ ಇಟ್ಟಿಗೆಗಳು.' : 'Machine pressed and kiln baked to withstand high load and extreme weather conditions.'
              },
              {
                icon: '📐',
                title: lang === 'kn' ? 'ನಿಖರ ಗಾತ್ರ & ಆಕಾರ' : 'Uniform Shape & Size',
                desc: lang === 'kn' ? 'ನಿರ್ಮಾಣದಲ್ಲಿ ಸಿಮೆಂಟ್ ಮತ್ತು ಮರಳಿನ ಬಳಕೆಯನ್ನು ಗಣನೀಯವಾಗಿ ಉಳಿಸುತ್ತದೆ.' : 'Consistent sharp edges and smooth finish reduce plastering and mortar mortar costs.'
              },
              {
                icon: '🚛',
                title: lang === 'kn' ? 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ ಡೆಲಿವರಿ' : 'GPS Tracked Reliable Delivery',
                desc: lang === 'kn' ? 'ನಿಮ್ಮ ಸೈಟ್ ಸ್ಥಳಕ್ಕೆ ಸುರಕ್ಷಿತವಾಗಿ ನೇರ ವಾಹನದ ಮೂಲಕ ತಲುಪಿಸಲಾಗುತ್ತದೆ.' : 'Dispatched with truck tracking and delivered safely straight to your construction site.'
              }
            ].map((f, i) => (
              <div key={i} style={{
                background: '#ffffff',
                border: '1.5px solid #e7e5e4',
                borderRadius: 18,
                padding: '24px 20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#1c1917', marginBottom: 8 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 5. FACTORY LOCATION & CONTACT (H96P+4X5 Bommenahalli) ─── */}
        <section id="contact" style={{
          background: '#ffffff',
          borderRadius: 24,
          padding: '36px 40px',
          border: '1.5px solid #e7e5e4',
          marginBottom: 40,
          boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 36, alignItems: 'center' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#c2410c', fontWeight: 800, fontSize: 13, marginBottom: 8 }}>
                <MapPin size={16} />
                <span>{lang === 'kn' ? 'ಕಾರ್ಖಾನೆ ಸ್ಥಳ ಮತ್ತು ವಿಳಾಸ' : 'MANUFACTURING UNIT & LOCATION'}</span>
              </div>
              <h2 style={{ fontSize: 28, fontWeight: 900, color: '#1c1917', marginBottom: 12 }}>
                MBI Bricks Industries
              </h2>
              <p style={{ fontSize: 14, color: '#57534e', lineHeight: 1.65, marginBottom: 20 }}>
                H96P+4X5, Bommenahalli, Handanakere Hobli, C N Halli Tq, Karnataka 572119
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#292524', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: '#c2410c' }}>📞 {lang === 'kn' ? 'ದೂರವಾಣಿ:' : 'Phone:'}</span>
                  <span>+91 63661 94899</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: '#c2410c' }}>✉️ {lang === 'kn' ? 'ಇಮೇಲ್:' : 'Email:'}</span>
                  <span>contact@mbibricks.com</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 700, color: '#c2410c' }}>🏷️ {lang === 'kn' ? 'ಪ್ಲಸ್ ಕೋಡ್:' : 'Plus Code:'}</span>
                  <span style={{ fontWeight: 700 }}>H96P+4X5</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=H96P%2B4X5,Bommenahalli,Handanakere+Hobli,C+N+Halli+Tq,Karnataka+572119"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#c2410c',
                    color: '#ffffff',
                    padding: '12px 24px',
                    borderRadius: 9999,
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none',
                    boxShadow: '0 4px 14px rgba(194,65,12,0.25)'
                  }}
                >
                  <MapPin size={16} />
                  <span>{lang === 'kn' ? 'ಗೂಗಲ್ ಮ್ಯಾಪ್ಸ್‌ನಲ್ಲಿ ನೋಡಿ' : 'Open in Google Maps'}</span>
                  <ExternalLink size={12} />
                </a>

                <a
                  href="https://wa.me/916366194899?text=Hello%20MBI%20Bricks,%20I%20would%20like%20to%20inquire%20about%20brick%20pricing%20and%20delivery."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    border: '1.5px solid #22c55e',
                    background: '#ffffff',
                    color: '#22c55e',
                    padding: '12px 24px',
                    borderRadius: 9999,
                    fontWeight: 800,
                    fontSize: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    textDecoration: 'none'
                  }}
                >
                  <MessageCircle size={16} />
                  <span>{lang === 'kn' ? 'ವಾಟ್ಸಾಪ್ ವಿಚಾರಣೆ' : 'WhatsApp Inquiry'}</span>
                </a>
              </div>
            </div>

            {/* Plus code visual tag */}
            <div style={{
              background: '#f5f5f4',
              borderRadius: 20,
              padding: '32px 24px',
              textAlign: 'center',
              border: '1.5px dashed #d6d3d1'
            }}>
              <div style={{ fontSize: 44, marginBottom: 8 }}>🧱📍</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#78716c', textTransform: 'uppercase', letterSpacing: 1 }}>
                Location Plus Code
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#c2410c', margin: '8px 0 12px', letterSpacing: 1 }}>
                H96P+4X5
              </div>
              <p style={{ fontSize: 13, color: '#57534e', maxWidth: 300, margin: '0 auto' }}>
                Bommenahalli, Handanakere Hobli, C N Halli Tq, Karnataka 572119
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
