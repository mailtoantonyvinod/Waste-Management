// src/components/Navbar.jsx

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLORS = {
  admin:    '#2c3e50',
  worker:   '#16a085',
  resident: '#2980b9',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={{
      background: ROLE_COLORS[user.role] || '#333',
      color: '#fff',
      padding: '0 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: 60,
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <span style={{ fontSize: 22, fontWeight: 700 }}>🌱 Waste-Mgmt-Portal</span>

        {user.role === 'resident' && (
          <Link to="/dashboard" style={linkStyle}>My Requests</Link>
        )}
        {user.role === 'worker' && (
          <Link to="/dashboard" style={linkStyle}>Zone Requests</Link>
        )}
        {user.role === 'admin' && (
          <>
            <Link to="/dashboard" style={linkStyle}>All Requests</Link>
            <Link to="/admin/zones" style={linkStyle}>Zone Stats</Link>
          </>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontSize: 14, opacity: 0.85 }}>
          👤 {user.name}
          <span style={{
            marginLeft: 8,
            background: 'rgba(255,255,255,0.2)',
            padding: '2px 8px',
            borderRadius: 12,
            fontSize: 12,
            textTransform: 'capitalize',
          }}>{user.role}</span>
          {user.zone && <span style={{ marginLeft: 6, opacity: 0.7, fontSize: 12 }}>• {user.zone}</span>}
        </span>
        <button onClick={handleLogout} style={{
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.3)',
          color: '#fff',
          padding: '6px 16px',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: 14,
        }}>Logout</button>
      </div>
    </nav>
  );
}

const linkStyle = {
  color: '#fff',
  textDecoration: 'none',
  padding: '4px 12px',
  borderRadius: 6,
  fontSize: 15,
  background: 'rgba(255,255,255,0.1)',
};
