import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [], 
  requireAuth = true 
}) => {
  const { user } = useAuth();

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  // If no roles are specified, just check if user is authenticated
  if (allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Super admin has access to everything
  if (user && user.role === 'super_admin') {
    return <>{children}</>;
  }

  // Check if user's role is in the allowed roles
  if (user && allowedRoles.includes(user.role)) {
    return <>{children}</>;
  }

  // User doesn't have permission - redirect to home
  return <Navigate to="/home" replace />;
};

export default ProtectedRoute;
