// src/pages/Login.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm]     = useState({ email: '', password: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick-fill demo credentials
  const fillDemo = (role) => {
    const creds = {
      admin:    { email: 'admin@waste.com',     password: 'password123' },
      worker:   { email: 'worker1@waste.com',   password: 'password123' },
      resident: { email: 'resident1@waste.com', password: 'password123' },
    };
    setForm(creds[role]);
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: 4, color: '#2c3e50', whiteSpace: 'nowrap', fontSize: 30 }}>
          🌱 Waste-Mgmt-Portal
        </h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 28 }}>
          Neighbourhood Waste Pickup Request System
        </p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Email</label>
          <input
            name="email" type="email" value={form.email}
            onChange={handleChange} required
            style={inputStyle} placeholder="you@example.com"
          />

          <label style={labelStyle}>Password</label>
          <input
            name="password" type="password" value={form.password}
            onChange={handleChange} required
            style={inputStyle} placeholder="••••••••"
          />

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: '#555', fontSize: 14 }}>
          Don't have an account? <Link to="/register" style={{ color: '#2980b9' }}>Register</Link>
        </p>

        {/* Demo buttons for evaluators */}
        <div style={{ marginTop: 24, borderTop: '1px solid #eee', paddingTop: 16 }}>
          <p style={{ fontSize: 12, color: '#999', textAlign: 'center', marginBottom: 10 }}>
            Demo credentials (for testing)
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {['admin', 'worker', 'resident'].map(role => (
              <button key={role} onClick={() => fillDemo(role)} style={demoBtn}>
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const pageStyle  = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' };
const cardStyle  = { background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: 420 };
const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 600, color: '#2c3e50', fontSize: 14 };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 18, fontSize: 15, boxSizing: 'border-box' };
const btnStyle   = { width: '100%', padding: '12px', background: '#2980b9', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' };
const errorStyle = { background: '#ffeaea', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 };
const demoBtn    = { padding: '5px 12px', fontSize: 12, border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: '#f8f9fa', textTransform: 'capitalize' };
