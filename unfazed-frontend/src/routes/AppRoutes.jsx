import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthOverview from '../pages/auth/AuthOverview';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/therapist/Dashboard';
import Clients from '../pages/therapist/Clients';
import Schedule from '../pages/therapist/Schedule';
import Notes from '../pages/therapist/Notes';
import Analytics from '../pages/therapist/Analytics';
import Profile from '../pages/therapist/Profile';
import BookingPage from '../pages/client/BookingPage';
import ClientPortal from '../pages/client/ClientPortal';
import Payment from '../pages/client/Payment';
import TelehealthRoom from '../pages/client/TelehealthRoom';
import Loader from '../components/common/Loader';

// -----------------------------------------------------------------
// STRICT DOCTOR ROUTE GUARD: ONLY allows authenticated doctors
// Clients can NEVER view or enter the Doctor Workspace!
// -----------------------------------------------------------------
const DoctorProtectedRoute = ({ children }) => {
  const { user, sessionRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Verifying practitioner credentials..." />
      </div>
    );
  }

  // If signed in as client, strictly forbid and redirect to their client sanctuary
  if (sessionRole === 'client') {
    return <Navigate to="/portal" replace />;
  }

  // If not signed in as doctor, redirect to doctor login
  if (!user || sessionRole !== 'doctor') {
    return <Navigate to="/login/doctor" replace />;
  }

  return children;
};

// -----------------------------------------------------------------
// STRICT CLIENT ROUTE GUARD: ONLY allows authenticated clients
// -----------------------------------------------------------------
const ClientProtectedRoute = ({ children }) => {
  const { clientUser, sessionRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader message="Loading client sanctuary..." />
      </div>
    );
  }

  // If signed in as doctor, redirect to doctor dashboard
  if (sessionRole === 'doctor') {
    return <Navigate to="/therapist/dashboard" replace />;
  }

  // If not signed in as client, redirect to client login
  if (!clientUser || sessionRole !== 'client') {
    return <Navigate to="/login/client" replace />;
  }

  return children;
};

export const AppRoutes = () => {
  const { user, clientUser, sessionRole, loading } = useAuth();

  return (
    <Routes>
      {/* Root Route: Role-based landing */}
      <Route
        path="/"
        element={
          loading ? (
            <Loader message="Loading..." />
          ) : sessionRole === 'doctor' && user ? (
            <Navigate to="/therapist/dashboard" replace />
          ) : sessionRole === 'client' && clientUser ? (
            <Navigate to="/portal" replace />
          ) : (
            <AuthOverview />
          )
        }
      />

      {/* Overview */}
      <Route path="/overview" element={<AuthOverview />} />

      {/* SEPARATE LOGINS FOR DOCTOR & CLIENT */}
      <Route path="/login" element={<Login />} />
      <Route path="/login/doctor" element={<Login forcedRole="doctor" />} />
      <Route path="/login/client" element={<Login forcedRole="client" />} />

      {/* SEPARATE REGISTRATION FOR DOCTOR & CLIENT */}
      <Route path="/register" element={<Register />} />
      <Route path="/register/doctor" element={<Register forcedRole="doctor" />} />
      <Route path="/register/client" element={<Register forcedRole="client" />} />

      {/* Client Sanctuary (Protected strictly for clients) */}
      <Route
        path="/portal"
        element={
          <ClientProtectedRoute>
            <ClientPortal />
          </ClientProtectedRoute>
        }
      />
      <Route path="/payment" element={<Payment />} />

      {/* Doctor Practice Hub (Protected strictly for doctors) */}
      <Route
        path="/therapist/dashboard"
        element={
          <DoctorProtectedRoute>
            <Dashboard />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="/therapist/clients"
        element={
          <DoctorProtectedRoute>
            <Clients />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="/therapist/schedule"
        element={
          <DoctorProtectedRoute>
            <Schedule />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="/therapist/notes"
        element={
          <DoctorProtectedRoute>
            <Notes />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="/therapist/analytics"
        element={
          <DoctorProtectedRoute>
            <Analytics />
          </DoctorProtectedRoute>
        }
      />
      <Route
        path="/therapist/profile"
        element={
          <DoctorProtectedRoute>
            <Profile />
          </DoctorProtectedRoute>
        }
      />

      {/* Interactive Telehealth Video Meeting Room */}
      <Route path="/meet/:sessionId" element={<TelehealthRoom />} />

      {/* Branded Link: /:slug (e.g. /dr-sharma) */}
      <Route path="/:slug" element={<BookingPage />} />

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
