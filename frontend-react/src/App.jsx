import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { LogOut, ShieldAlert, UserCheck, Key, RefreshCw } from 'lucide-react';

// Context creation for Global Auth State
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// API URL helper
export const API_BASE = 'http://localhost:8000/api/auth';
export const NODE_API_BASE = 'http://localhost:5001/api';

// Pages import (will create these files next)
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import AdminDashboard from './pages/AdminDashboard';
import DistributorDashboard from './pages/DistributorDashboard';

// Custom Route Guardians
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/distributor'} replace />;
  }

  return children;
};

// Main Navbar Component
const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">
        <ShieldAlert size={24} className="text-primary" />
        <span>Secure Auth Portal</span>
      </Link>
      <div className="nav-user">
        <span className="flex align-center gap-2">
          <UserCheck size={18} className="text-muted" />
          <strong>{user.username}</strong>
          <span className={`badge badge-${user.role.toLowerCase()}`}>{user.role}</span>
        </span>
        <button onClick={() => { logout(); navigate('/login'); }} className="btn btn-secondary btn-sm flex align-center gap-2">
          <LogOut size={14} />
          Logout
        </button>
      </div>
    </nav>
  );
};

// Landing Page Component
const LandingPage = () => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/distributor'} replace />;
  }

  return (
    <div className="auth-wrapper" style={{ minHeight: '100vh', flexDirection: 'column', justifyContent: 'center', gap: '2rem' }}>
      <div className="card text-center" style={{ maxWidth: '600px', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ background: 'var(--primary-light)', padding: '1.5rem', borderRadius: '50%', color: 'var(--primary)' }}>
          <ShieldAlert size={64} />
        </div>
        <h1 style={{ fontSize: '2.5rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          User Authentication System
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '450px', margin: '0 auto' }}>
          A secure, multi-role (Admin & Distributor) access control system featuring Simple JWT tokens, Node.js audit logs, and SMTP/SMS OTP-based password recovery.
        </p>
        
        <div className="flex gap-4" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
          <Link to="/login" className="btn btn-primary" style={{ flex: 1, maxWidth: '180px', textDecoration: 'none' }}>
            Sign In Portal
          </Link>
          <Link to="/register" className="btn btn-secondary" style={{ flex: 1, maxWidth: '180px', textDecoration: 'none' }}>
            Register Distributor
          </Link>
        </div>
      </div>
      
      <div className="grid grid-3" style={{ maxWidth: '900px', width: '100%' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 className="flex align-center gap-2" style={{ color: 'var(--primary)', marginBottom: '0.5rem' }}>
            <Key size={18} /> Role-Based Access
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Separate dashboard views, permission levels, and registration approval pipelines for Admins and Distributors.
          </p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 className="flex align-center gap-2" style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>
            <UserCheck size={18} /> Secure Simple JWT
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Stateless authentication utilizing cryptographically signed JSON Web Tokens for cross-service authorization.
          </p>
        </div>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <h3 className="flex align-center gap-2" style={{ color: 'var(--warning)', marginBottom: '0.5rem' }}>
            <RefreshCw size={18} /> Multi-Channel OTP
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Password reset flow via SMS (Twilio) and Email (SMTP) supporting secure expiration and audit-logging.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('auth_user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (authToken, userData) => {
    localStorage.setItem('auth_token', authToken);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex align-center justify-between" style={{ height: '100vh', justifyContent: 'center' }}>
        <p>Loading Secure Auth System...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Router>
        <div className="app-container">
          <Navbar />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/distributor" 
              element={
                <ProtectedRoute allowedRoles={['DISTRIBUTOR']}>
                  <DistributorDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
