import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axiosInstance';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Doctor / Therapist
  const [clientUser, setClientUser] = useState(null); // Client / Patient
  const [sessionRole, setSessionRole] = useState(null); // 'doctor' | 'client' | null
  const [entitlements, setEntitlements] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount with strict mutual exclusivity
  useEffect(() => {
    const activeRole = localStorage.getItem('unfazed_role');

    if (activeRole === 'client') {
      // 1. Strictly Client Session: Purge any lingering doctor token
      localStorage.removeItem('unfazed_token');
      setUser(null);
      setEntitlements(null);

      const savedClient = localStorage.getItem('unfazed_client_user');
      if (savedClient) {
        try {
          const parsed = JSON.parse(savedClient);
          setClientUser(parsed);
          setSessionRole('client');
        } catch (e) {
          localStorage.removeItem('unfazed_client_user');
          localStorage.removeItem('unfazed_role');
          setClientUser(null);
          setSessionRole(null);
        }
      } else {
        localStorage.removeItem('unfazed_role');
        setSessionRole(null);
      }
      setLoading(false);
    } else if (activeRole === 'doctor' || (!activeRole && localStorage.getItem('unfazed_token'))) {
      // 2. Strictly Doctor Session: Purge any client session
      localStorage.removeItem('unfazed_client_user');
      setClientUser(null);

      const token = localStorage.getItem('unfazed_token');
      if (!token) {
        setSessionRole(null);
        setLoading(false);
        return;
      }

      const fetchDoctor = async () => {
        try {
          const res = await api.get('/auth/me');
          if (res.data.success) {
            setUser(res.data.therapist);
            setEntitlements(res.data.entitlements);
            setSessionRole('doctor');
            localStorage.setItem('unfazed_role', 'doctor');
          }
        } catch (err) {
          console.warn('Doctor session expired or invalid:', err.message);
          localStorage.removeItem('unfazed_token');
          localStorage.removeItem('unfazed_role');
          setUser(null);
          setEntitlements(null);
          setSessionRole(null);
        } finally {
          setLoading(false);
        }
      };

      fetchDoctor();
    } else {
      // 3. No active session
      localStorage.removeItem('unfazed_token');
      localStorage.removeItem('unfazed_client_user');
      localStorage.removeItem('unfazed_role');
      setUser(null);
      setClientUser(null);
      setSessionRole(null);
      setLoading(false);
    }
  }, []);

  // DOCTOR LOGIN: Strictly purges client session
  const login = async (email, password) => {
    // Purge any client state first
    localStorage.removeItem('unfazed_client_user');
    setClientUser(null);

    const res = await api.post('/auth/login', { email, password });
    if (res.data.success) {
      localStorage.setItem('unfazed_token', res.data.token);
      localStorage.setItem('unfazed_role', 'doctor');
      setUser(res.data.therapist);
      setEntitlements(res.data.entitlements);
      setSessionRole('doctor');
      return res.data;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  // DOCTOR REGISTER: Strictly purges client session
  const register = async (payload) => {
    localStorage.removeItem('unfazed_client_user');
    setClientUser(null);

    const res = await api.post('/auth/register', payload);
    if (res.data.success) {
      localStorage.setItem('unfazed_token', res.data.token);
      localStorage.setItem('unfazed_role', 'doctor');
      setUser(res.data.therapist);
      setEntitlements(res.data.entitlements);
      setSessionRole('doctor');
      return res.data;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  // CLIENT LOGIN: Strictly purges doctor session & token
  const loginClient = async (email) => {
    // Purge any doctor token and state first
    localStorage.removeItem('unfazed_token');
    setUser(null);
    setEntitlements(null);

    const res = await api.post('/auth/client/login', { email });
    if (res.data.success) {
      localStorage.setItem('unfazed_client_user', JSON.stringify(res.data.client));
      localStorage.setItem('unfazed_role', 'client');
      setClientUser(res.data.client);
      setSessionRole('client');
      return res.data;
    }
    throw new Error(res.data.message || 'Client login failed');
  };

  // CLIENT REGISTER: Strictly purges doctor session & token
  const registerClient = async (payload) => {
    localStorage.removeItem('unfazed_token');
    setUser(null);
    setEntitlements(null);

    const res = await api.post('/auth/client/register', payload);
    if (res.data.success) {
      localStorage.setItem('unfazed_client_user', JSON.stringify(res.data.client));
      localStorage.setItem('unfazed_role', 'client');
      setClientUser(res.data.client);
      setSessionRole('client');
      return res.data;
    }
    throw new Error(res.data.message || 'Client registration failed');
  };

  // DOCTOR LOGOUT
  const logout = () => {
    localStorage.removeItem('unfazed_token');
    localStorage.removeItem('unfazed_role');
    setUser(null);
    setEntitlements(null);
    setSessionRole(null);
  };

  // CLIENT LOGOUT
  const logoutClient = () => {
    localStorage.removeItem('unfazed_client_user');
    localStorage.removeItem('unfazed_role');
    setClientUser(null);
    setSessionRole(null);
  };

  const refreshUser = async () => {
    if (sessionRole !== 'doctor') return;
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.therapist);
        setEntitlements(res.data.entitlements);
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  const upgradeTier = async (targetTier) => {
    const res = await api.post('/therapist/upgrade-tier', { targetTier });
    if (res.data.success) {
      setUser(res.data.therapist);
      setEntitlements(res.data.entitlements);
      return res.data;
    }
    throw new Error(res.data.message || 'Upgrade failed');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        clientUser,
        sessionRole,
        entitlements,
        loading,
        login,
        register,
        logout,
        loginClient,
        registerClient,
        logoutClient,
        refreshUser,
        upgradeTier,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export default AuthContext;
