import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, User, Search, Menu, X, Heart, Package, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';

export default function Header() {
  const { user, logout } = useAuth();
  const { itemCount } = useCart();
  const { lang, switchLang } = useLang();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSearchQ('');
    }
  };

  return (
    <>
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        height: '76px',
        background: '#ffffff',
        borderBottom: '1px solid #f0eeea',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)'
      }}>
        <div style={{
          maxWidth: 1360,
          margin: '0 auto',
          padding: '0 24px',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* 🧱 Logo matching screenshot */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none' }}>
            {/* SVG Brick Pattern Logo matching image */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <svg width="40" height="32" viewBox="0 0 38 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Row 1 */}
                <rect x="0" y="0" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="13.5" y="0" width="11" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="27.5" y="0" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                {/* Row 2 */}
                <rect x="0" y="6.4" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="20" y="6.4" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                {/* Row 3 */}
                <rect x="0" y="12.8" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="13.5" y="12.8" width="11" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="27.5" y="12.8" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                {/* Row 4 */}
                <rect x="0" y="19.2" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="20" y="19.2" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                {/* Row 5 */}
                <rect x="0" y="25.6" width="10.5" height="4.4" rx="1.5" fill="#c2410c"/>
                <rect x="13.5" y="25.6" width="11" height="4.4" rx="1.5" fill="#c2410c"/>
                <rect x="27.5" y="25.6" width="10.5" height="4.4" rx="1.5" fill="#c2410c"/>
              </svg>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: -0.5, color: '#1c1917', lineHeight: 1.1 }}>
                MBI BRICKS
              </span>
              <span style={{ fontSize: 8.5, fontWeight: 800, letterSpacing: 1.2, color: '#c2410c', textTransform: 'uppercase', marginTop: 3 }}>
                BUILT FOR A BETTER TOMORROW
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="header-nav" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <Link to="/" style={{
              position: 'relative',
              fontWeight: 700,
              fontSize: 15,
              color: '#1c1917',
              padding: '6px 0',
              textDecoration: 'none'
            }}>
              {lang === 'kn' ? 'ಮುಖಪುಟ' : t(lang, 'home')}
              {isActive('/') && (
                <span style={{
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  right: 0,
                  height: 3.5,
                  background: '#c2410c',
                  borderRadius: 2
                }} />
              )}
            </Link>

            <Link to="/products" style={{
              position: 'relative',
              fontWeight: 600,
              fontSize: 15,
              color: '#1c1917',
              padding: '6px 0',
              textDecoration: 'none'
            }}>
              {lang === 'kn' ? 'ಇಟ್ಟಿಗೆಗಳು' : t(lang, 'bricks')}
              {isActive('/products') && (
                <span style={{ position: 'absolute', bottom: -2, left: 0, right: 0, height: 3.5, background: '#c2410c', borderRadius: 2 }} />
              )}
            </Link>

            <a href="#about" style={{ fontWeight: 600, fontSize: 15, color: '#1c1917', textDecoration: 'none' }}>
              {lang === 'kn' ? 'ನಮ್ಮ ವ್ಯಕ್ತಿತ್ವ' : t(lang, 'ourIdentity')}
            </a>

            <a href="#quality" style={{ fontWeight: 600, fontSize: 15, color: '#1c1917', textDecoration: 'none' }}>
              {lang === 'kn' ? 'ಗುಣಮಟ್ಟ' : t(lang, 'quality')}
            </a>

            <a href="#contact" style={{ fontWeight: 600, fontSize: 15, color: '#1c1917', textDecoration: 'none' }}>
              {lang === 'kn' ? 'ಸಂಪರ್ಕಿಸಿ' : t(lang, 'contact')}
            </a>
          </nav>

          {/* Right Header Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Language Switcher Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#ffffff',
              border: '1.5px solid #e7e5e4',
              borderRadius: 9999,
              padding: '2px',
              height: 36
            }}>
              <button
                type="button"
                onClick={() => switchLang('en')}
                style={{
                  padding: '4px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 9999,
                  border: 'none',
                  background: lang === 'en' ? '#c2410c' : 'transparent',
                  color: lang === 'en' ? '#ffffff' : '#57534e',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => switchLang('kn')}
                style={{
                  padding: '4px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: 9999,
                  border: 'none',
                  background: lang === 'kn' ? '#c2410c' : 'transparent',
                  color: lang === 'kn' ? '#ffffff' : '#57534e',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                ಕನ್ನಡ
              </button>
            </div>

            {/* Search Icon */}
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              style={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: '#1c1917',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Search"
            >
              <Search size={20} />
            </button>

            {/* Shopping Cart Icon with badge */}
            <Link to="/cart" style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'transparent',
              color: '#1c1917',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}>
              <ShoppingCart size={20} />
              <span style={{
                position: 'absolute',
                top: 0,
                right: 0,
                background: '#c2410c',
                color: '#ffffff',
                fontSize: 10,
                fontWeight: 800,
                width: 17,
                height: 17,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {itemCount || 0}
              </span>
            </Link>

            {/* User / Login Pill Button matching screenshot */}
            {user ? (
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '7px 18px',
                    borderRadius: 9999,
                    background: '#ffffff',
                    border: '1.5px solid #292524',
                    color: '#1c1917',
                    fontWeight: 700,
                    fontSize: 13.5,
                    cursor: 'pointer'
                  }}
                >
                  <User size={16} />
                  <span>{user.full_name?.split(' ')[0]}</span>
                </button>

                {userMenuOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: 10,
                    background: '#ffffff', border: '1px solid #e7e5e4',
                    borderRadius: 16, minWidth: 200, zIndex: 1000,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)', overflow: 'hidden'
                  }}>
                    <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0eeea' }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#1c1917' }}>{user.full_name}</div>
                      <div style={{ color: '#78716c', fontSize: 12 }}>{user.email}</div>
                    </div>
                    {user.role === 'customer' && (
                      <>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#292524', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                          <User size={15} /> {t(lang, 'profile')}
                        </Link>
                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#292524', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                          <Package size={15} /> {t(lang, 'myOrders')}
                        </Link>
                        <Link to="/wishlist" onClick={() => setUserMenuOpen(false)} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#292524', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                          <Heart size={15} /> {t(lang, 'wishlist')}
                        </Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <Link to="/admin/dashboard" onClick={() => setUserMenuOpen(false)} style={{ padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10, color: '#c2410c', fontWeight: 700, textDecoration: 'none', fontSize: 13 }}>
                        Admin Dashboard →
                      </Link>
                    )}
                    <button onClick={handleLogout} style={{ width: '100%', color: '#ef4444', padding: '11px 18px', display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: 600, borderTop: '1px solid #f0eeea' }}>
                      <LogOut size={15} /> {t(lang, 'logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 18px',
                borderRadius: 9999,
                background: '#ffffff',
                border: '1.5px solid #292524',
                color: '#1c1917',
                fontWeight: 700,
                fontSize: 13.5,
                textDecoration: 'none',
                transition: 'all 0.2s'
              }}>
                <User size={16} />
                <span>{lang === 'kn' ? 'ಲಾಗಿನ್' : 'Login'}</span>
              </Link>
            )}

            {/* Mobile menu trigger */}
            <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)} style={{ background: 'none', border: 'none', color: '#1c1917', cursor: 'pointer', display: 'none' }}>
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay modal */}
      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)} style={{ zIndex: 1100 }}>
          <div style={{ width: '100%', maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <form onSubmit={handleSearch} style={{ background: '#ffffff', border: '2px solid #c2410c', borderRadius: 20, padding: '16px 20px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Search size={20} color="#78716c" />
              <input
                autoFocus
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder={t(lang, 'searchProducts')}
                style={{ flex: 1, background: 'none', border: 'none', color: '#1c1917', fontSize: 17, outline: 'none' }}
              />
              <button type="button" onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', color: '#78716c', cursor: 'pointer' }}><X size={20} /></button>
            </form>
          </div>
        </div>
      )}

      {/* Close dropdown on outside click */}
      {userMenuOpen && <div style={{ position: 'fixed', inset: 0, zIndex: 999 }} onClick={() => setUserMenuOpen(false)} />}
    </>
  );
}
