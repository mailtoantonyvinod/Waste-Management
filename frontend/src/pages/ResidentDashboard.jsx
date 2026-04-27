// src/pages/ResidentDashboard.jsx

import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending:   '#f39c12',
  assigned:  '#2980b9',
  completed: '#27ae60',
  rejected:  '#e74c3c',
};

const WASTE_TYPES = ['general', 'recyclable', 'hazardous', 'bulky'];

export default function ResidentDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]         = useState({ address: '', waste_type: 'general', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  const fetchRequests = async () => {
    try {
      const { data } = await api.get('/requests');
      setRequests(data);
    } catch (err) {
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await api.post('/requests', form);
      setSuccess('Pickup request submitted successfully!');
      setShowForm(false);
      setForm({ address: '', waste_type: 'general', description: '' });
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this pickup request?')) return;
    try {
      await api.delete(`/requests/${id}`);
      setSuccess('Request cancelled.');
      fetchRequests();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel request');
    }
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>My Pickup Requests</h2>
          <p style={{ margin: '4px 0 0', color: '#666', fontSize: 14 }}>Zone: {user.zone || 'Not assigned'}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={primaryBtn}>
          {showForm ? '✕ Cancel' : '+ New Request'}
        </button>
      </div>

      {error   && <div style={errorBox}>{error}</div>}
      {success && <div style={successBox}>{success}</div>}

      {/* New Request Form */}
      {showForm && (
        <div style={formCard}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>New Pickup Request</h3>
          <form onSubmit={handleSubmit}>
            <label style={label}>Address</label>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              required style={input} placeholder="Enter your full address" />

            <label style={label}>Waste Type</label>
            <select value={form.waste_type} onChange={e => setForm(p => ({ ...p, waste_type: e.target.value }))} style={input}>
              {WASTE_TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
            </select>

            <label style={label}>Description (optional)</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              style={{ ...input, minHeight: 80, resize: 'vertical' }} placeholder="Describe the waste items..." />

            <button type="submit" disabled={submitting} style={primaryBtn}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      )}

      {/* Requests List */}
      {loading ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Loading requests...</p>
      ) : requests.length === 0 ? (
        <div style={emptyState}>
          <p style={{ fontSize: 48 }}>🗑️</p>
          <p>No pickup requests yet. Create your first one!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <div key={req.id} style={requestCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ ...badge, background: STATUS_COLORS[req.status] }}>
                    {req.status.toUpperCase()}
                  </span>
                  <span style={{ ...badge, background: '#8e44ad', marginLeft: 8 }}>
                    {req.waste_type}
                  </span>
                  <h4 style={{ margin: '10px 0 4px', color: '#2c3e50' }}>{req.address}</h4>
                  {req.description && <p style={{ margin: '4px 0', color: '#555', fontSize: 14 }}>{req.description}</p>}
                  {req.worker_name && (
                    <p style={{ margin: '6px 0 0', color: '#666', fontSize: 13 }}>
                      👷 Assigned to: {req.worker_name}
                    </p>
                  )}
                  {req.worker_notes && (
                    <p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>
                      📝 Notes: {req.worker_notes}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, fontSize: 12, color: '#999' }}>
                    {new Date(req.created_at).toLocaleDateString()}
                  </p>
                  {req.status === 'pending' && (
                    <button onClick={() => handleCancel(req.id)} style={cancelBtn}>Cancel</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const pageStyle   = { maxWidth: 800, margin: '32px auto', padding: '0 16px' };
const primaryBtn  = { background: '#2980b9', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const cancelBtn   = { background: 'transparent', color: '#e74c3c', border: '1px solid #e74c3c', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13, marginTop: 8 };
const formCard    = { background: '#fff', padding: 24, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: 24 };
const requestCard = { background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0' };
const badge       = { color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 };
const label       = { display: 'block', marginBottom: 6, fontWeight: 600, color: '#2c3e50', fontSize: 14 };
const input       = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 16, fontSize: 15, boxSizing: 'border-box' };
const emptyState  = { textAlign: 'center', padding: 60, color: '#888', background: '#fff', borderRadius: 12 };
const errorBox    = { background: '#ffeaea', color: '#c0392b', padding: '10px 16px', borderRadius: 8, marginBottom: 16 };
const successBox  = { background: '#eafaf1', color: '#1e8449', padding: '10px 16px', borderRadius: 8, marginBottom: 16 };
