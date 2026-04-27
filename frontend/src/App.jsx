// src/App.jsx - Main router with role-based route protection

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ResidentDashboard from './pages/ResidentDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import AdminDashboard from './pages/AdminDashboard';

// Redirect to correct dashboard based on role
function DashboardRouter() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin')    return <AdminDashboard />;
  if (user.role === 'worker')   return <WorkerDashboard />;
  return <ResidentDashboard />;
}

// Protect routes: redirect to login if not authenticated
function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"    element={user ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
        <Route path="/dashboard" element={<PrivateRoute><DashboardRouter /></PrivateRoute>} />
        <Route path="/admin/zones" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
