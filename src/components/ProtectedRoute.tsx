// src/components/ProtectedRoute.tsx

import { type ReactNode } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>;
  }

  if (!currentUser) {
    // If there is no user, redirect to the login page
    return <Navigate to="/login" />;
  }

  // If there is a user, render the child components (the dashboard)
  return children;
};

export default ProtectedRoute;