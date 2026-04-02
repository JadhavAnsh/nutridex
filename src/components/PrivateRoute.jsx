import { useAuth } from '@clerk/react';
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false);
    }
  }, [isLoaded]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF5F8] via-white to-[#FFF0F5]">
        <div className="text-[#FF4081] text-xl">Loading...</div>
      </div>
    );
  }
  
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default PrivateRoute;
