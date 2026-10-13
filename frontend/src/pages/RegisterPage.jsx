import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LanguageContext';
import { t } from '../translations';
import { User, Mail, Lock, Phone, MapPin, Eye, EyeOff, ArrowRight, Sparkles, ShieldCheck, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const { register, loginWithGoogle } = useAuth();
  const { lang } = useLang();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', password: '', city: '', state: 'Karnataka', pincode: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const user = await register(form);
      toast.success(`Welcome to MBI Bricks, ${user.full_name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleGoogleRegister = async () => {
    setGoogleLoading(true);
    try {
      const user = await loginWithGoogle('customer');
      toast.success(`Welcome to MBI Bricks, ${user.full_name.split(' ')[0]}!`);
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Google registration failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justify: 'center',
      background: 'radial-gradient(circle at 50% 10%, #2a150c 0%, #09090b 80%)',
      padding: '32px 16px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        background: 'radial-gradient(circle, rgba(234, 88, 12, 0.18) 0%, rgba(0,0,0,0) 70%)',
        pointerEvents: 'none',
        borderRadius: '50%'
      }} />

      {/* Main Split Glass Card */}
      <div style={{
        width: '100%',
        maxWidth: 1080,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        borderRadius: 28,
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 30px 80px rgba(0,0,0,0.8)',
        background: 'rgba(18, 18, 22, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        position: 'relative',
        zIndex: 2
      }}>
        {/* Left Side: Brand Visual Panel */}
        <div style={{
          position: 'relative',
          padding: 40,
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          minHeight: 560,
          background: 'url(/hero-bricks.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, rgba(13,13,18,0.55) 0%, rgba(13,13,18,0.95) 100%)'
          }} />

          <div style={{ position: 'relative', zIndex: 2 }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
              <div style={{
                width: 46,
                height: 46,
                background: 'linear-gradient(135deg,#ea580c,#c2440f)',
                borderRadius: 14,
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                fontSize: 24,
                boxShadow: '0 6px 20px rgba(234, 88, 12, 0.5)'
              }}>🧱</div>
              <div>
                <span style={{ fontWeight: 900, fontSize: 22, color: '#ffffff', display: 'block', letterSpacing: -0.5 }}>MBI BRICKS</span>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.2, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>Built for a better tomorrow</span>
              </div>
            </Link>
          </div>

          <div style={{ position: 'relative', zIndex: 2, marginTop: 40 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(234, 88, 12, 0.2)',
              border: '1px solid rgba(234, 88, 12, 0.4)',
              color: '#ea580c',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 16
            }}>
              <Sparkles size={14} /> Join 500+ Happy Builders
            </div>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#ffffff', lineHeight: 1.2, marginBottom: 14 }}>
              Direct Factory Order & Site Delivery
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              Create an account to browse brick catalogs, request bulk pricing, track site deliveries, and save favorite products.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                'Direct factory pricing — no middleman markup',
                'IS Standard tested Wirecut & Table Mould Bricks',
                'On-time transport & live order status updates'
              ].map((text, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.9)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(234,88,12,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ea580c' }}>✓</div>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: The Registration Glass Form */}
        <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', marginBottom: 6, letterSpacing: -0.5 }}>{t(lang, 'createAccount')}</h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Get started with MBI Bricks Industries</p>
          </div>

          {/* Google Sign In / Register Button */}
          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={googleLoading}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justify: 'center',
              gap: 12,
              padding: '12px 20px',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(255,255,255,0.06)',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              marginBottom: 20
            }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            {googleLoading ? 'Connecting to Google...' : 'Sign up with Google / Gmail'}
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: 0.5
          }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
            <span>OR REGISTER WITH EMAIL</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  {t(lang, 'fullName')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                    <User size={16} />
                  </div>
                  <input
                    value={form.full_name}
                    onChange={set('full_name')}
                    placeholder="Full Name"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  {t(lang, 'mobile')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                    <Phone size={16} />
                  </div>
                  <input
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder="9XXXXXXXXX"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  {t(lang, 'email')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder="your@email.com"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 40px',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ gridColumn: '1/-1' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  {t(lang, 'password')} *
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', display: 'flex' }}>
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={set('password')}
                    placeholder="Min. 6 characters"
                    required
                    style={{
                      width: '100%',
                      padding: '10px 40px 10px 40px',
                      background: 'rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 13,
                      outline: 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255,255,255,0.5)',
                      cursor: 'pointer',
                      display: 'flex'
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  {t(lang, 'city')}
                </label>
                <input
                  value={form.city}
                  onChange={set('city')}
                  placeholder="e.g. Tumkur"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 }}>
                  {t(lang, 'pincode')}
                </label>
                <input
                  value={form.pincode}
                  onChange={set('pincode')}
                  placeholder="572119"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.35)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    color: '#ffffff',
                    fontSize: 13,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center',
                gap: 8,
                padding: '13px 24px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, #ea580c, #c2440f)',
                boxShadow: '0 8px 24px rgba(234, 88, 12, 0.45)',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: 15,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Creating Account...' : t(lang, 'createAccount')} <ArrowRight size={18} />
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>
              {t(lang, 'alreadyHaveAccount')}{' '}
              <Link to="/login" style={{ color: '#f97316', fontWeight: 700, textDecoration: 'none' }}>
                {t(lang, 'login')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


