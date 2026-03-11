import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const RequireAuth = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  if (!user) {
    // not logged in, redirect to login
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default RequireAuth;
