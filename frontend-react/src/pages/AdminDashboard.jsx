import React, { useState, useEffect } from 'react';
import { useAuth, API_BASE, NODE_API_BASE } from '../App';
import { Users, FileSpreadsheet, Activity, RefreshCw, AlertTriangle, ShieldCheck, Mail, Phone, Check, X, Slash } from 'lucide-react';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [distributors, setDistributors] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingDist, setLoadingDist] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  
  const [errorDist, setErrorDist] = useState('');
  const [errorLogs, setErrorLogs] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // holds user ID currently updating

  const fetchDistributors = async () => {
    setLoadingDist(true);
    setErrorDist('');
    try {
      const res = await fetch(`${API_BASE}/admin/distributors/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to fetch distributors');
      setDistributors(data);
    } catch (err) {
      setErrorDist(err.message);
    } finally {
      setLoadingDist(false);
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingLogs(true);
    setErrorLogs('');
    try {
      const res = await fetch(`${NODE_API_BASE}/audit-logs`);
      if (!res.ok) throw new Error('Could not contact Node.js audit microservice');
      const data = await res.json();
      setAuditLogs(data);
    } catch (err) {
      setErrorLogs(err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchDistributors();
    fetchAuditLogs();
  }, []);

  const handleAction = async (userId, action) => {
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/admin/distributors/action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ user_id: userId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to execute administration action');
      
      // Update local distributor list
      setDistributors(prev => prev.map(d => d.id === userId ? { ...d, status: data.user.status } : d));
      
      // Refresh audit logs
      fetchAuditLogs();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Helper stats
  const totalDists = distributors.length;
  const pendingDists = distributors.filter(d => d.status === 'PENDING').length;
  const activeDists = distributors.filter(d => d.status === 'ACTIVE').length;

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Overview stats */}
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 800 }}>Admin Management Console</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Approve distributor registration applications and view live security audit ledgers.</p>
      </header>

      <div className="grid grid-3" style={{ marginBottom: '2.5rem' }}>
        <div className="card flex align-center gap-4">
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <Users size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalDists}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Distributors</p>
          </div>
        </div>
        <div className="card flex align-center gap-4">
          <div style={{ background: 'var(--warning-light)', color: 'var(--warning)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{pendingDists}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Pending Approval</p>
          </div>
        </div>
        <div className="card flex align-center gap-4">
          <div style={{ background: 'var(--success-light)', color: 'var(--success)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeDists}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Active Operators</p>
          </div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Distributor Directory */}
        <section className="card flex flex-col" style={{ gap: '1rem', overflow: 'hidden' }}>
          <div className="flex justify-between align-center">
            <h2 className="flex align-center gap-2" style={{ fontSize: '1.25rem' }}>
              <FileSpreadsheet size={20} className="text-primary" /> Registered Distributors
            </h2>
            <button onClick={fetchDistributors} className="btn btn-secondary btn-sm flex align-center gap-1">
              <RefreshCw size={12} /> Reload
            </button>
          </div>

          {errorDist && <div className="alert alert-danger">{errorDist}</div>}

          {loadingDist ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading distributor profiles...</p>
          ) : distributors.length === 0 ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No distributors registered yet.</p>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Channels</th>
                    <th>Status</th>
                    <th>Administration</th>
                  </tr>
                </thead>
                <tbody>
                  {distributors.map(dist => (
                    <tr key={dist.id}>
                      <td>
                        <strong>{dist.username}</strong>
                      </td>
                      <td>{dist.email}</td>
                      <td>
                        <span className="flex gap-2">
                          <span title={dist.is_email_verified ? 'Email verified' : 'Email unverified'} style={{ display: 'inline-flex', alignHeight: 'center', padding: '2px', color: dist.is_email_verified ? 'var(--success)' : 'var(--text-muted)' }}>
                            <Mail size={16} />
                          </span>
                          <span title={dist.is_phone_verified ? 'Phone verified' : 'Phone unverified'} style={{ display: 'inline-flex', alignHeight: 'center', padding: '2px', color: dist.is_phone_verified ? 'var(--success)' : 'var(--text-muted)' }}>
                            <Phone size={16} />
                          </span>
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge-${dist.status.toLowerCase()}`}>{dist.status}</span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          {dist.status === 'PENDING' && (
                            <button
                              onClick={() => handleAction(dist.id, 'approve')}
                              disabled={actionLoading === dist.id}
                              className="btn btn-success btn-sm"
                            >
                              Approve
                            </button>
                          )}
                          {dist.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleAction(dist.id, 'suspend')}
                              disabled={actionLoading === dist.id}
                              className="btn btn-danger btn-sm"
                            >
                              Suspend
                            </button>
                          )}
                          {dist.status === 'SUSPENDED' && (
                            <button
                              onClick={() => handleAction(dist.id, 'activate')}
                              disabled={actionLoading === dist.id}
                              className="btn btn-primary btn-sm"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Live Audit Log */}
        <section className="card flex flex-col" style={{ gap: '1rem', maxHeight: '550px' }}>
          <div className="flex justify-between align-center">
            <h2 className="flex align-center gap-2" style={{ fontSize: '1.25rem' }}>
              <Activity size={20} className="text-success" /> Live Security Ledger
            </h2>
            <button onClick={fetchAuditLogs} className="btn btn-secondary btn-sm flex align-center gap-1">
              <RefreshCw size={12} /> Poll
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>
            Security events fetched live from the <strong>Node.js Microservice</strong> audit gateway.
          </p>

          {errorLogs && (
            <div className="alert alert-danger" style={{ fontSize: '0.75rem', padding: '0.5rem' }}>
              <span>{errorLogs}</span>
            </div>
          )}

          {loadingLogs ? (
            <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading ledger logs...</p>
          ) : (
            <div className="flex flex-col gap-2" style={{ overflowY: 'auto', flex: 1, padding: '0.25rem', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'var(--bg-primary)' }}>
              {auditLogs.map((log) => (
                <div 
                  key={log.id} 
                  style={{
                    fontSize: '0.75rem', 
                    padding: '0.5rem', 
                    background: 'var(--bg-secondary)', 
                    borderLeft: `3px solid ${log.status === 'SUCCESS' ? 'var(--success)' : log.status === 'FAILURE' ? 'var(--danger)' : 'var(--warning)'}`,
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <div className="flex justify-between" style={{ color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span><strong>{log.event_type}</strong></span>
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{log.description || `Log event by user: ${log.username}`}</p>
                  <div className="flex justify-between" style={{ color: 'var(--text-muted)', fontSize: '0.7rem', marginTop: '0.25rem' }}>
                    <span>User: <strong>{log.username}</strong></span>
                    <span>IP: {log.ip_address}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
