import { createContext, useCallback, useContext, useEffect, useState } from 'react';

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
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const checkAuth = useCallback(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Login with any credentials — no API call needed
  const login = (fullName, email) => {
    const dummyUser = {
      full_name: fullName || 'Demo User',
      email: email || 'demo@nutridex.com',
      date_joined: new Date().toISOString()
    };
    localStorage.setItem('user', JSON.stringify(dummyUser));
    setUser(dummyUser);
    setIsAuthenticated(true);
    return true;
  };

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout: handleLogout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
