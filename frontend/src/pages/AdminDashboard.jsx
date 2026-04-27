// src/pages/AdminDashboard.jsx

import { useState, useEffect } from 'react';
import api from '../api';

const STATUS_COLORS = { pending: '#f39c12', assigned: '#2980b9', completed: '#27ae60', rejected: '#e74c3c' };

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats]       = useState(null);
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [error, setError]       = useState('');

  const fetchAll = async () => {
    try {
      const [reqRes, statsRes, workersRes] = await Promise.all([
        api.get('/requests'),
        api.get('/zones/stats'),
        api.get('/zones/workers'),
      ]);
      setRequests(reqRes.data);
      setStats(statsRes.data);
      setWorkers(workersRes.data);
    } catch {
      setError('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/requests/${id}/status`, { status });
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    }
  };

  const zones = ['all', ...new Set(requests.map(r => r.zone))];

  const filtered = requests.filter(r => {
    const statusOk = filter === 'all' || r.status === filter;
    const zoneOk   = zoneFilter === 'all' || r.zone === zoneFilter;
    return statusOk && zoneOk;
  });

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#2c3e50', marginBottom: 20 }}>Admin Dashboard</h2>

      {error && <div style={errorBox}>{error}</div>}

      {/* Overall stats */}
      {stats && (
        <div style={statsGrid}>
          {[
            { label: 'Total', value: stats.overall.total, color: '#2c3e50' },
            { label: 'Pending',   value: stats.overall.pending,   color: STATUS_COLORS.pending },
            { label: 'Assigned',  value: stats.overall.assigned,  color: STATUS_COLORS.assigned },
            { label: 'Completed', value: stats.overall.completed, color: STATUS_COLORS.completed },
            { label: 'Rejected',  value: stats.overall.rejected,  color: STATUS_COLORS.rejected },
          ].map(s => (
            <div key={s.label} style={statCard}>
              <div style={{ fontSize: 32, fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#666' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Zone breakdown */}
      {stats?.by_zone?.length > 0 && (
        <div style={section}>
          <h3 style={{ margin: '0 0 14px', color: '#2c3e50' }}>📍 Zone Breakdown</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Zone', 'Total', 'Pending', 'Assigned', 'Completed', 'Rejected'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.by_zone.map(z => (
                  <tr key={z.zone} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={td}><strong>{z.zone}</strong></td>
                    <td style={td}>{z.total}</td>
                    <td style={{ ...td, color: STATUS_COLORS.pending }}>{z.pending}</td>
                    <td style={{ ...td, color: STATUS_COLORS.assigned }}>{z.assigned}</td>
                    <td style={{ ...td, color: STATUS_COLORS.completed }}>{z.completed}</td>
                    <td style={{ ...td, color: STATUS_COLORS.rejected }}>{z.rejected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Workers */}
      {workers.length > 0 && (
        <div style={section}>
          <h3 style={{ margin: '0 0 14px', color: '#2c3e50' }}>👷 Workers</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {workers.map(w => (
              <div key={w.id} style={workerCard}>
                <strong>{w.name}</strong>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#666' }}>{w.zone || 'No zone'}</p>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: STATUS_COLORS.completed }}>
                  ✓ {w.completed_count} completed
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All requests table */}
      <div style={section}>
        <h3 style={{ margin: '0 0 14px', color: '#2c3e50' }}>📋 All Pickup Requests</h3>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <select value={filter} onChange={e => setFilter(e.target.value)} style={select}>
            <option value="all">All Statuses</option>
            {['pending', 'assigned', 'completed', 'rejected'].map(s => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
            ))}
          </select>
          <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} style={select}>
            {zones.map(z => <option key={z} value={z}>{z === 'all' ? 'All Zones' : z}</option>)}
          </select>
        </div>

        {loading ? <p>Loading...</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table style={table}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['#', 'Resident', 'Zone', 'Address', 'Type', 'Status', 'Date', 'Action'].map(h => (
                    <th key={h} style={th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(req => (
                  <tr key={req.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={td}>{req.id}</td>
                    <td style={td}>{req.resident_name}</td>
                    <td style={td}>{req.zone}</td>
                    <td style={td}>{req.address}</td>
                    <td style={{ ...td, textTransform: 'capitalize' }}>{req.waste_type}</td>
                    <td style={td}>
                      <span style={{ ...badge, background: STATUS_COLORS[req.status] }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={td}>{new Date(req.created_at).toLocaleDateString()}</td>
                    <td style={td}>
                      {req.status === 'pending' && (
                        <button onClick={() => handleStatusChange(req.id, 'rejected')} style={rejectBtn}>
                          Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: '#888' }}>No requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const pageStyle  = { maxWidth: 1100, margin: '32px auto', padding: '0 16px' };
const statsGrid  = { display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' };
const statCard   = { background: '#fff', padding: '20px 28px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center', flex: 1, minWidth: 100 };
const section    = { background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 };
const workerCard = { background: '#f8f9fa', padding: '14px 18px', borderRadius: 8, minWidth: 160 };
const table      = { width: '100%', borderCollapse: 'collapse', fontSize: 14 };
const th         = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#555', fontSize: 13 };
const td         = { padding: '12px 14px', color: '#333' };
const badge      = { color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 };
const select     = { padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', fontSize: 14, cursor: 'pointer' };
const rejectBtn  = { background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12 };
const errorBox   = { background: '#ffeaea', color: '#c0392b', padding: '10px 16px', borderRadius: 8, marginBottom: 16 };
