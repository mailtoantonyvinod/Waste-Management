// src/pages/WorkerDashboard.jsx

import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending:   '#f39c12',
  assigned:  '#2980b9',
  completed: '#27ae60',
  rejected:  '#e74c3c',
};

const WASTE_ICONS = { general: '🗑️', recyclable: '♻️', hazardous: '⚠️', bulky: '🛋️' };

export default function WorkerDashboard() {
  const { user }  = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [updating, setUpdating] = useState(null); // request id being updated
  const [notes, setNotes]       = useState({});   // { [id]: string }
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [filter, setFilter]     = useState('all');

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const updateStatus = async (id, status) => {
    setUpdating(id);
    setError('');
    try {
      await api.patch(`/requests/${id}/status`, { status, worker_notes: notes[id] || '' });
      setSuccess(`Request marked as ${status}`);
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Update failed');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const counts   = { pending: 0, assigned: 0, completed: 0 };
  requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div style={pageStyle}>
      <h2 style={{ color: '#2c3e50', marginBottom: 4 }}>Zone Requests</h2>
      <p style={{ color: '#666', marginBottom: 20, fontSize: 14 }}>Your zone: <strong>{user.zone}</strong></p>

      {/* Stats bar */}
      <div style={statsBar}>
        {Object.entries(counts).map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: STATUS_COLORS[k] }}>{v}</div>
            <div style={{ fontSize: 12, color: '#666', textTransform: 'capitalize' }}>{k}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['all', 'pending', 'assigned'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            ...filterBtn,
            background: filter === f ? '#16a085' : '#f0f0f0',
            color: filter === f ? '#fff' : '#333',
          }}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {error   && <div style={errorBox}>{error}</div>}
      {success && <div style={successBox}>{success}</div>}

      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={emptyState}><p>✅ No requests in this category.</p></div>
      ) : (
        filtered.map(req => (
          <div key={req.id} style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ ...badge, background: STATUS_COLORS[req.status] }}>{req.status.toUpperCase()}</span>
                  <span style={{ marginLeft: 8, fontSize: 18 }}>{WASTE_ICONS[req.waste_type]}</span>
                  <span style={{ marginLeft: 4, fontSize: 13, color: '#666', textTransform: 'capitalize' }}>{req.waste_type}</span>
                </div>
                <h4 style={{ margin: '0 0 4px', color: '#2c3e50' }}>📍 {req.address}</h4>
                {req.description && <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>{req.description}</p>}
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#888' }}>
                  By: {req.resident_name} | {new Date(req.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action area */}
              {req.status !== 'completed' && req.status !== 'rejected' && (
                <div style={{ minWidth: 220 }}>
                  <textarea
                    value={notes[req.id] || ''}
                    onChange={e => setNotes(p => ({ ...p, [req.id]: e.target.value }))}
                    placeholder="Add notes (optional)..."
                    style={notesInput}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {req.status === 'pending' && (
                      <button onClick={() => updateStatus(req.id, 'assigned')}
                        disabled={updating === req.id} style={assignBtn}>
                        Accept
                      </button>
                    )}
                    {req.status === 'assigned' && (
                      <button onClick={() => updateStatus(req.id, 'completed')}
                        disabled={updating === req.id} style={completeBtn}>
                        ✓ Mark Done
                      </button>
                    )}
                    <button onClick={() => updateStatus(req.id, 'rejected')}
                      disabled={updating === req.id} style={rejectBtn}>
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

const pageStyle  = { maxWidth: 900, margin: '32px auto', padding: '0 16px' };
const statsBar   = { display: 'flex', gap: 32, background: '#fff', padding: '20px 32px', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 24 };
const filterBtn  = { padding: '7px 16px', border: 'none', borderRadius: 20, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const card       = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', marginBottom: 12 };
const badge      = { color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 };
const notesInput = { width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', minHeight: 60, boxSizing: 'border-box' };
const assignBtn  = { flex: 1, background: '#2980b9', color: '#fff', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const completeBtn = { flex: 1, background: '#27ae60', color: '#fff', border: 'none', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const rejectBtn  = { flex: 1, background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '8px', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 13 };
const emptyState = { textAlign: 'center', padding: 48, color: '#888', background: '#fff', borderRadius: 12 };
const errorBox   = { background: '#ffeaea', color: '#c0392b', padding: '10px 16px', borderRadius: 8, marginBottom: 16 };
const successBox = { background: '#eafaf1', color: '#1e8449', padding: '10px 16px', borderRadius: 8, marginBottom: 16 };
