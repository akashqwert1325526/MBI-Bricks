import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: 'owner@mbibricks.com', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter both email and password');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // First attempt to log in
      await login(form.email, form.password);
      toast.success('Welcome back, Owner!');
      navigate('/admin/dashboard');
    } catch (err) {
      console.warn('Login attempt failed, checking if auto-register is applicable...', err.code);

      // If user account is not found or credential invalid in Firebase Auth, automatically attempt to create the account
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/invalid-credential' ||
        err.message?.includes('user-not-found') ||
        err.message?.includes('invalid-credential')
      ) {
        try {
          await register(form.email, form.password, 'Owner');
          toast.success('Firebase Owner account created & logged in!');
          navigate('/admin/dashboard');
          return;
        } catch (regErr) {
          console.error('Registration error:', regErr);
          if (regErr.code === 'auth/wrong-password') {
            toast.error('Incorrect password for this existing account.');
          } else {
            toast.error(regErr.message || 'Authentication error');
          }
        }
      } else if (err.code === 'auth/wrong-password') {
        toast.error('Incorrect password. Please enter your correct Firebase password.');
      } else {
        toast.error(err.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--dark)', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(194,68,15,0.1) 0%, transparent 70%)' }} />

      <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg,#c2440f,#f59e0b)', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 16px', boxShadow: '0 8px 32px rgba(194,68,15,0.4)' }}>🧱</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, marginBottom: 4 }}>MBI BRICKS</h1>
          <p style={{ color: 'var(--primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, fontSize: 13 }}>Owner Dashboard Login</p>
        </div>

        <div className="card" style={{ border: '1px solid rgba(194,68,15,0.3)', boxShadow: '0 0 40px rgba(194,68,15,0.15)' }}>
          <div className="card-header">
            <h2 className="modal-title" style={{ textAlign: 'center', fontSize: 20 }}>🔐 Owner Sign In</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="owner@mbibricks.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter password (minimum 6 characters)"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <button className="btn btn-primary btn-lg" type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                {loading ? 'Signing in to Firebase...' : '🔓 Sign In / Access Dashboard'}
              </button>
            </form>
          </div>
          <div className="card-footer" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Note: Password must be at least 6 characters. If accessing for the first time, your owner account will be created automatically in Firebase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
