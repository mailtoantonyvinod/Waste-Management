// src/pages/Register.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ZONES = ['Zone A - North', 'Zone B - South', 'Zone C - East', 'Zone D - West'];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'resident', zone: '' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.role !== 'admin' && !form.zone) {
      return setError('Please select your zone');
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <h1 style={{ textAlign: 'center', marginBottom: 4, color: '#2c3e50' }}>🌱 Waste-Mgmt-Portal</h1>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: 28 }}>Create your account</p>

        {error && <div style={errorStyle}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Full Name</label>
          <input name="name" value={form.name} onChange={handleChange} required style={inputStyle} placeholder="Your name" />

          <label style={labelStyle}>Email</label>
          <input name="email" type="email" value={form.email} onChange={handleChange} required style={inputStyle} placeholder="you@example.com" />

          <label style={labelStyle}>Password</label>
          <input name="password" type="password" value={form.password} onChange={handleChange} required minLength={6} style={inputStyle} placeholder="Min 6 characters" />

          <label style={labelStyle}>Role</label>
          <select name="role" value={form.role} onChange={handleChange} style={inputStyle}>
            <option value="resident">Resident</option>
            <option value="worker">Municipal Worker</option>
          </select>

          {form.role !== 'admin' && (
            <>
              <label style={labelStyle}>Zone</label>
              <select name="zone" value={form.zone} onChange={handleChange} style={inputStyle} required>
                <option value="">-- Select your zone --</option>
                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
              </select>
            </>
          )}

          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 16, color: '#555', fontSize: 14 }}>
          Already have an account? <Link to="/login" style={{ color: '#2980b9' }}>Login</Link>
        </p>
      </div>
    </div>
  );
}

const pageStyle  = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' };
const cardStyle  = { background: '#fff', padding: 40, borderRadius: 12, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', width: '100%', maxWidth: 440 };
const labelStyle = { display: 'block', marginBottom: 6, fontWeight: 600, color: '#2c3e50', fontSize: 14 };
const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #ddd', marginBottom: 18, fontSize: 15, boxSizing: 'border-box' };
const btnStyle   = { width: '100%', padding: '12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' };
const errorStyle = { background: '#ffeaea', color: '#c0392b', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 14 };
