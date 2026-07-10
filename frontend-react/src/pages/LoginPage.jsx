import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, API_BASE } from '../App';
import { Lock, User, Eye, EyeOff, KeyRound, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || data.non_field_errors?.[0] || 'Invalid credentials');
      }

      login(data.access, data.user);
      
      // Navigate to respective dashboard
      if (data.user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/distributor');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="flex align-center justify-between" style={{ justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <ShieldCheck size={40} />
          </div>
          <h2>Secure Portal Sign In</h2>
          <p>Provide credentials to access your user workspace</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="username"
                type="text"
                className="form-control"
                style={{ paddingLeft: '38px', width: '100%' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <div className="flex justify-between align-center" style={{ width: '100%' }}>
              <label className="form-label" htmlFor="password">Password</label>
              <Link to="/forgot-password" style={{ fontSize: '0.75rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                Forgot Password?
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                style={{ paddingLeft: '38px', paddingRight: '38px', width: '100%' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have a distributor account? <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Register here</Link>
        </div>

        {/* Demo Helper box to easily test */}
        <div style={{ marginTop: '2rem', padding: '1rem', background: 'var(--bg-primary)', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius-md)', fontSize: '0.75rem' }}>
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            <KeyRound size={12} /> Live Demo Credentials:
          </h4>
          <ul style={{ paddingLeft: '1.25rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <li><strong>Admin</strong>: <code>admin</code> / <code>admin123</code></li>
            <li><strong>Active Distributor</strong>: <code>distributor</code> / <code>distributor123</code></li>
            <li><strong>Pending Distributor</strong>: <code>pending_distributor</code> / <code>distributor123</code></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
