import { Link } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import { Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

export default function Footer() {
  const { lang } = useLang();
  return (
    <footer style={{ background: '#ffffff', borderTop: '1.5px solid #f0eeea', padding: '60px 0 30px', color: '#1c1917' }} id="contact">
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: 48,
          marginBottom: 48
        }}>
          {/* Brand Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <svg width="34" height="26" viewBox="0 0 38 30" fill="none">
                <rect x="0" y="0" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="13.5" y="0" width="11" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="27.5" y="0" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="0" y="6.4" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="20" y="6.4" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="0" y="12.8" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="13.5" y="12.8" width="11" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="27.5" y="12.8" width="10.5" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="0" y="19.2" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="20" y="19.2" width="18" height="4.6" rx="1.5" fill="#c2410c"/>
                <rect x="0" y="25.6" width="10.5" height="4.4" rx="1.5" fill="#c2410c"/>
                <rect x="13.5" y="25.6" width="11" height="4.4" rx="1.5" fill="#c2410c"/>
                <rect x="27.5" y="25.6" width="10.5" height="4.4" rx="1.5" fill="#c2410c"/>
              </svg>
              <div>
                <div style={{ fontWeight: 900, fontSize: 18, color: '#1c1917', lineHeight: 1 }}>MBI BRICKS</div>
                <div style={{ fontSize: 8, fontWeight: 800, color: '#c2410c', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 2 }}>BUILT FOR A BETTER TOMORROW</div>
              </div>
            </div>

            <p style={{ fontSize: 14, color: '#57534e', lineHeight: 1.6, maxWidth: 380 }}>
              MBI Bricks Industries — Premier high-strength brick manufacturer in Karnataka.<br />
              <strong>Owner: Nandakumar B C</strong>
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, color: '#57534e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Phone size={15} color="#c2410c" />
                <span style={{ fontWeight: 600 }}>+91 63661 94899</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Mail size={15} color="#c2410c" />
                <span>contact@mbibricks.com</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <MapPin size={16} color="#c2410c" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ffedd5', color: '#c2410c', padding: '2px 8px', borderRadius: 4, fontWeight: 700, fontSize: 12, marginBottom: 4 }}>
                    📍 Location Tag: H96P+4X5
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.5 }}>H96P+4X5, Bommenahalli, Handanakere Hobli, C N Halli Tq, Karnataka 572119</div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h4 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#1c1917', marginBottom: 16 }}>
              {t(lang, 'products')}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/products" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>Wirecut Bricks</Link>
              <Link to="/products" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>Table Mould Bricks</Link>
              <Link to="/products" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>{t(lang, 'viewProducts')} →</Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#1c1917', marginBottom: 16 }}>
              Quick Links
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>{t(lang, 'home')}</Link>
              <Link to="/products" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>{t(lang, 'products')}</Link>
              <Link to="/cart" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>{t(lang, 'cart')}</Link>
              <Link to="/orders" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>{t(lang, 'myOrders')}</Link>
              <Link to="/profile" style={{ fontSize: 14, color: '#57534e', textDecoration: 'none' }}>{t(lang, 'profile')}</Link>
            </div>
          </div>

          {/* Business & Support */}
          <div>
            <h4 style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: 1, color: '#1c1917', marginBottom: 16 }}>
              Factory Hours
            </h4>
            <p style={{ fontSize: 13, color: '#57534e', lineHeight: 1.7, marginBottom: 12 }}>
              Monday – Saturday: 7:00 AM – 7:00 PM<br />
              Sunday: 8:00 AM – 2:00 PM
            </p>
            <a
              href="https://wa.me/916366194899"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 20,
                background: '#22c55e',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none'
              }}
            >
              💬 WhatsApp Support
            </a>
          </div>
        </div>

        {/* Footer Bottom */}
        <div style={{
          borderTop: '1px solid #f0eeea',
          paddingTop: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: 13,
          color: '#78716c',
          flexWrap: 'wrap',
          gap: 12
        }}>
          <div>© {new Date().getFullYear()} MBI Bricks Industries. All rights reserved.</div>
          <div>Built with quality for Karnataka construction</div>
        </div>
      </div>
    </footer>
  );
}
