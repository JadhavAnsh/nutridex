import { useClerk, useAuth as useClerkAuth, useUser } from '@clerk/react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import axiosInstance, { setAuthTokenGetter } from '../api/axios';

const AuthContext = createContext(null);
const PLACEHOLDER_EMAIL_SUFFIX = '@clerk.local';
const PLACEHOLDER_NAME_PATTERN = /^user_[A-Za-z0-9]+$/;

const isPlaceholderEmail = (email) =>
  !email || email.toLowerCase().endsWith(PLACEHOLDER_EMAIL_SUFFIX);

const isPlaceholderName = (fullName, clerkId) => {
  if (!fullName) {
    return true;
  }

  const normalizedName = fullName.trim();
  return normalizedName === clerkId || PLACEHOLDER_NAME_PATTERN.test(normalizedName);
};

const getClerkIdentity = (clerkUser) => {
  if (!clerkUser) {
    return {};
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ||
    clerkUser.emailAddresses?.[0]?.emailAddress ||
    null;
  const fullName =
    clerkUser.fullName ||
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') ||
    clerkUser.firstName ||
    null;

  return {
    email: email ? email.trim().toLowerCase() : null,
    full_name: fullName ? fullName.trim() : null,
    clerk_id: clerkUser.id || null,
    clerk_created_at: clerkUser.createdAt ? new Date(clerkUser.createdAt).toISOString() : null,
  };
};

const mergeUserProfile = (profile = {}, clerkIdentity = {}) => ({
  ...profile,
  full_name: clerkIdentity.full_name || profile?.full_name || null,
  email: clerkIdentity.email || profile?.email || null,
  clerk_id: profile?.clerk_id || clerkIdentity.clerk_id || null,
  clerk_created_at: profile?.clerk_created_at || clerkIdentity.clerk_created_at || null,
});

const shouldSyncIdentity = (profile, clerkIdentity) => {
  if (!profile || (!clerkIdentity.email && !clerkIdentity.full_name)) {
    return false;
  }

  const emailNeedsSync =
    !!clerkIdentity.email &&
    (isPlaceholderEmail(profile.email) || profile.email?.toLowerCase() !== clerkIdentity.email);
  const fullNameNeedsSync =
    !!clerkIdentity.full_name &&
    (isPlaceholderName(profile.full_name, clerkIdentity.clerk_id) ||
      profile.full_name !== clerkIdentity.full_name);

  return emailNeedsSync || fullNameNeedsSync;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { isLoaded: isAuthLoaded, isSignedIn, getToken } = useClerkAuth();
  const { isLoaded: isUserLoaded, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const clerkIdentity = useMemo(() => getClerkIdentity(clerkUser), [clerkUser]);
  const isClerkReady = isAuthLoaded && isUserLoaded;

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const hydrateProfile = useCallback(async () => {
    if (!isClerkReady) {
      return;
    }

    if (!isSignedIn) {
      setUser(null);
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        setUser(mergeUserProfile({}, clerkIdentity));
        setError(null);
        return;
      }

      const response = await axiosInstance.get('/profile/');
      let profile = response.data;

      if (shouldSyncIdentity(profile, clerkIdentity)) {
        try {
          const syncPayload = {};
          if (clerkIdentity.email) {
            syncPayload.email = clerkIdentity.email;
          }
          if (clerkIdentity.full_name) {
            syncPayload.full_name = clerkIdentity.full_name;
          }

          if (Object.keys(syncPayload).length > 0) {
            const syncResponse = await axiosInstance.patch('/profile/', syncPayload);
            profile = syncResponse.data;
          }
        } catch (syncError) {
          console.error('Profile identity sync error:', syncError);
        }
      }

      setUser(mergeUserProfile(profile, clerkIdentity));
      setError(null);
    } catch (err) {
      console.error('Profile hydration error:', err);
      setError('Failed to fetch user profile');
      setUser(mergeUserProfile({}, clerkIdentity));
    } finally {
      setLoading(false);
    }
  }, [clerkIdentity, getToken, isClerkReady, isSignedIn]);

  useEffect(() => {
    setAuthTokenGetter(isClerkReady && isSignedIn ? getToken : null);
  }, [getToken, isClerkReady, isSignedIn]);

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
    setUser((currentUser) => mergeUserProfile({ ...currentUser, ...updatedUser }, clerkIdentity));
    if (updatedUser.weight || updatedUser.conditions) {
      localStorage.setItem('userHealthProfile', JSON.stringify({
        weight: updatedUser.weight,
        height: updatedUser.height,
        bmi: updatedUser.bmi,
        conditions: updatedUser.conditions
      }));
    }
  }, [clerkIdentity]);

  const value = {
    isClerkReady,
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
