import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AccessDenied from '../../components/AccessDenied';

interface AdminRouteProps {
  children: React.ReactNode;
}

interface UserState {
  role: string | null;
  isAuthenticated: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useSelector((state: { user: UserState }) => state.user);
  
  console.log('AdminRoute - User state:', user);
  console.log('AdminRoute - User role:', user.role);
  console.log('AdminRoute - Is authenticated:', user.isAuthenticated);
  
  // If user is not authenticated, redirect to login
  if (!user.isAuthenticated) {
    console.log('AdminRoute - User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // If user is authenticated but not admin, show access denied
  if (user.role !== 'admin') {
    console.log('AdminRoute - User is not admin, showing access denied');
    return <AccessDenied />;
  }
  
  console.log('AdminRoute - User is admin, allowing access');
  // If user is admin, render the protected component
  return <>{children}</>;
};

export default AdminRoute; 