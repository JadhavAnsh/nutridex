import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axiosInstance from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const checkAuth = useCallback(() => {
    const accessToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    if (accessToken && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Error parsing stored user data', err);
        handleLogout();
      }
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userHealthProfile');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  const updateProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    // Always sync the health profile if data exists
    if (updatedUser.weight || updatedUser.conditions) {
      localStorage.setItem('userHealthProfile', JSON.stringify({
        weight: updatedUser.weight,
        height: updatedUser.height,
        bmi: updatedUser.bmi,
        conditions: updatedUser.conditions
      }));
    }
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.post('/login/', { email, password });
      const data = response.data;

      // Store tokens and user data
      localStorage.setItem('accessToken', data.access);
      localStorage.setItem('refreshToken', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Check if onboarding is needed
      if (!data.user.weight) {
        localStorage.setItem('showOnboarding', 'true');
      } else {
        localStorage.removeItem('showOnboarding');
      }

      // Update state
      setUser(data.user);
      setIsAuthenticated(true);

      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to login. Please check your credentials.');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    error,
    login,
    logout: handleLogout,
    checkAuth,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
