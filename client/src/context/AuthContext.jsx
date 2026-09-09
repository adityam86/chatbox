import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('chatapp_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('chatapp_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('chatapp_user', JSON.stringify(res.data.user));
          connectSocket(res.data.user);
        } catch (err) {
          console.warn('Session expired or invalid, logging out.');
          logout();
        }
      }
      setLoading(false);
    }
    checkAuth();
  }, [token]);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { user, token } = res.data;
    localStorage.setItem('chatapp_token', token);
    localStorage.setItem('chatapp_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    connectSocket(user);
    return user;
  };

  const register = async (username, email, password, bio) => {
    const res = await api.post('/auth/register', { username, email, password, bio });
    const { user, token } = res.data;
    localStorage.setItem('chatapp_token', token);
    localStorage.setItem('chatapp_user', JSON.stringify(user));
    setToken(token);
    setUser(user);
    connectSocket(user);
    return user;
  };

  const logout = async () => {
    try {
      if (token) {
        await api.post('/auth/logout');
      }
    } catch (e) {
      // Ignore logout request errors
    } finally {
      localStorage.removeItem('chatapp_token');
      localStorage.removeItem('chatapp_user');
      setToken(null);
      setUser(null);
      disconnectSocket();
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('chatapp_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        loading,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
