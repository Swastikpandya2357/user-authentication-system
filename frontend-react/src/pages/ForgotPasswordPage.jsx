import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE } from '../App';
import { KeyRound, Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, HelpCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = request, 2 = verify & reset
  const [identifier, setIdentifier] = useState('');
  const [method, setMethod] = useState('email'); // 'email' or 'sms'
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [demoCode, setDemoCode] = useState('');

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your username, email, or phone number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/otp/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, method })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch security code');
      }

      setSuccessMsg(data.message);
      if (data.demo_code) {
        setDemoCode(data.demo_code);
      }
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!code || !newPassword) {
      setError('Please fill in the validation code and your new password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/otp/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          code,
          new_password: newPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired OTP code');
      }

      setStep(3); // success stage
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="auth-wrapper">
        <div className="auth-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ color: 'var(--success)', background: 'var(--success-light)', padding: '1.5rem', borderRadius: '50%', display: 'inline-flex' }}>
            <ShieldCheck size={48} />
          </div>
          <h2>Password Reset Completed</h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Your credentials have been securely updated. The OTP channel has been verified.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none' }}>
            Sign In with New Password
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="flex align-center justify-between" style={{ justifyContent: 'center', marginBottom: '1rem', color: 'var(--primary)' }}>
            <KeyRound size={40} />
          </div>
          <h2>Account Password Recovery</h2>
          <p>{step === 1 ? 'Select validation channel to receive safety OTP' : 'Enter security code to update credentials'}</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>{error}</span>
          </div>
        )}

        {successMsg && step === 2 && (
          <div className="alert alert-success">
            <div>
              <p>{successMsg}</p>
              {demoCode && (
                <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                  Demo Mode Bypass: Verification Code is <span style={{ color: 'var(--primary)', textDecoration: 'underline', fontSize: '1rem' }}>{demoCode}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="identifier">Identifier (Username, Email or Phone)</label>
              <input
                id="identifier"
                type="text"
                className="form-control"
                placeholder="Enter email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Verification Channel</label>
              <div className="flex gap-4" style={{ marginTop: '0.25rem' }}>
                <label className="card flex align-center gap-2" style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', borderColor: method === 'email' ? 'var(--primary)' : 'var(--border-light)', background: method === 'email' ? 'var(--primary-light)' : 'transparent', userSelect: 'none' }}>
                  <input
                    type="radio"
                    name="method"
                    value="email"
                    checked={method === 'email'}
                    onChange={() => setMethod('email')}
                    style={{ cursor: 'pointer' }}
                  />
                  <Mail size={16} style={{ color: method === 'email' ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Email OTP</span>
                </label>

                <label className="card flex align-center gap-2" style={{ flex: 1, padding: '0.75rem', cursor: 'pointer', borderColor: method === 'sms' ? 'var(--primary)' : 'var(--border-light)', background: method === 'sms' ? 'var(--primary-light)' : 'transparent', userSelect: 'none' }}>
                  <input
                    type="radio"
                    name="method"
                    value="sms"
                    checked={method === 'sms'}
                    onChange={() => setMethod('sms')}
                    style={{ cursor: 'pointer' }}
                  />
                  <Phone size={16} style={{ color: method === 'sms' ? 'var(--primary)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>SMS OTP</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Dispatching OTP...' : 'Send Security Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            <div className="form-group">
              <label className="form-label" htmlFor="otp">6-Digit Verification Code</label>
              <input
                id="otp"
                type="text"
                maxLength="6"
                className="form-control"
                style={{ letterSpacing: '0.25em', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px', width: '100%' }}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
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

            <div className="flex gap-4" style={{ marginTop: '1.5rem' }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>
                Change Channel
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? 'Updating Credentials...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Remember your password? <Link to="/login" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
