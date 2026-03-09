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
  const { user, isLoading } = useAuth();

  // Wait for auth state to hydrate from localStorage before making any routing decisions
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F4F4F4] via-white to-[#F4F4F4]">
        <div className="w-10 h-10 border-4 border-[#0072CE] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

  // User doesn't have the required role
  return <Navigate to="/unauthorized" replace />;
};

export default ProtectedRoute;
