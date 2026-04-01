import { useClerk, useAuth as useClerkAuth, useUser } from '@clerk/react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import axiosInstance, { setAuthTokenGetter } from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const hydrateProfile = useCallback(async () => {
    if (!isSignedIn) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.get('/profile/');
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error('Profile hydration error:', err);
      setError('Failed to fetch user profile');
      setUser({
        email: clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress,
        full_name: clerkUser?.fullName || clerkUser?.firstName || 'User',
      });
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, clerkUser]);

  useEffect(() => {
    setAuthTokenGetter(isSignedIn ? getToken : null);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    hydrateProfile();
  }, [hydrateProfile]);

  const checkAuth = useCallback(async () => {
    await hydrateProfile();
  }, [hydrateProfile]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('userHealthProfile');
    localStorage.removeItem('showOnboardingDismissed');
    signOut();
    setUser(null);
  }, [signOut]);

  const updateProfile = useCallback((updatedUser) => {
    setUser(updatedUser);
    if (updatedUser.weight || updatedUser.conditions) {
      localStorage.setItem('userHealthProfile', JSON.stringify({
        weight: updatedUser.weight,
        height: updatedUser.height,
        bmi: updatedUser.bmi,
        conditions: updatedUser.conditions
      }));
    }
  }, []);

  const value = {
    isAuthenticated: !!isSignedIn,
    user,
    loading,
    error,
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
