import React, { useState } from 'react';
import { useAuth } from '../App';
import { Key, Copy, Check, ShieldCheck, Mail, Phone, Calendar, ShoppingBag, Eye, EyeOff } from 'lucide-react';

export default function DistributorDashboard() {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateApiKey = () => {
    // Generate a mock secure distribution API Key
    const key = `dist_live_${Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')}`;
    setApiKey(key);
    setCopied(false);
  };

  const copyToClipboard = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Distributor Hub</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Welcome to your distributor account workspace. Access credentials and manage configurations.</p>
      </header>

      <div className="grid grid-2">
        {/* Profile Card */}
        <section className="card flex flex-col" style={{ gap: '1.25rem' }}>
          <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.25rem' }}>
            Account Profile Details
          </h2>
          
          <div className="flex flex-col gap-4">
            <div className="flex align-center gap-3">
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', display: 'inline-flex' }}>
                <Key size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distributor Username</p>
                <p style={{ fontWeight: 600 }}>{user.username}</p>
              </div>
            </div>

            <div className="flex align-center gap-3">
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', display: 'inline-flex' }}>
                <Mail size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email Contact</p>
                <p style={{ fontWeight: 600 }}>{user.email || 'None configured'}</p>
              </div>
              <span className={`badge badge-${user.is_email_verified ? 'active' : 'pending'}`}>
                {user.is_email_verified ? 'Verified' : 'Pending OTP'}
              </span>
            </div>

            <div className="flex align-center gap-3">
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', display: 'inline-flex' }}>
                <Phone size={18} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SMS Endpoint Phone</p>
                <p style={{ fontWeight: 600 }}>{user.phone_number || 'None configured'}</p>
              </div>
              <span className={`badge badge-${user.is_phone_verified ? 'active' : 'pending'}`}>
                {user.is_phone_verified ? 'Verified' : 'Pending OTP'}
              </span>
            </div>

            <div className="flex align-center gap-3">
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.5rem', borderRadius: '50%', display: 'inline-flex' }}>
                <Calendar size={18} />
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Level</p>
                <p style={{ fontWeight: 600 }} className="flex align-center gap-2">
                  Standard Distributor Profile 
                  <span className="badge badge-active">Authorized</span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* API Credentials Generation */}
        <section className="card flex flex-col" style={{ gap: '1.25rem', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
              Developer API Keys
            </h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Create signed distributor API keys to query system inventories, place bulk order webhooks, or sync shipping ledgers automatically.
            </p>

            {apiKey ? (
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Live API Access Key</label>
                <div style={{ position: 'relative', display: 'flex' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    readOnly
                    className="form-control"
                    style={{ flex: 1, paddingRight: '75px', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    value={apiKey}
                  />
                  <div style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
                    >
                      {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-secondary)', padding: '4px' }}
                    >
                      {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  </div>
                </div>
                {copied && <span style={{ fontSize: '0.75rem', color: 'var(--success)', marginTop: '0.25rem', display: 'block' }}>Key copied to clipboard.</span>}
              </div>
            ) : (
              <div style={{ border: '1px dashed var(--border-light)', background: 'var(--bg-primary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem', margin: '1rem 0' }}>
                No API Key generated. Generate one below to interface with services.
              </div>
            )}
          </div>

          <button onClick={generateApiKey} className="btn btn-primary" style={{ width: '100%' }}>
            {apiKey ? 'Regenerate API Key' : 'Generate API Key'}
          </button>
        </section>
      </div>

      {/* Distributor Mock Operations */}
      <section className="card flex flex-col" style={{ gap: '1rem', marginTop: '2rem' }}>
        <h2 className="flex align-center gap-2" style={{ fontSize: '1.25rem' }}>
          <ShoppingBag size={20} className="text-primary" /> Integrated Distributor Marketplace
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Review catalog inventory rates and track shipments via secure distributors nodes.
        </p>

        <div className="grid grid-3" style={{ marginTop: '0.5rem' }}>
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ marginBottom: '0.25rem' }}>Core Bulk Inventory</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Available wholesale stock rates</p>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--primary)' }}>45,210 Units</span>
          </div>
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ marginBottom: '0.25rem' }}>Wholesale Discount</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Active partner tier rates</p>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--success)' }}>12.5% Enabled</span>
          </div>
          <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ marginBottom: '0.25rem' }}>Shipment Logs</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Dispatched via local terminals</p>
            <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--warning)' }}>3 Deliveries Pending</span>
          </div>
        </div>
      </section>
    </div>
  );
}
