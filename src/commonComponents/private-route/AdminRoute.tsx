import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import AccessDenied from "../../components/AccessDenied";

interface AdminRouteProps {
  children: React.ReactNode;
}

interface UserState {
  role: string | null;
  isAuthenticated: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const user = useSelector((state: { user: UserState }) => state.user);

  //console.log('AdminRoute - User state:', user);
  //console.log('AdminRoute - User role:', user.role);
  //console.log('AdminRoute - Is authenticated:', user.isAuthenticated);

  // If user is not authenticated, redirect to login
  if (!user.isAuthenticated) {
    //console.log('AdminRoute - User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // If user is authenticated but not admin or instructor, show access denied
  if (user.role !== "admin" && user.role !== "instructor") {
    //console.log('AdminRoute - User is not admin or instructor, showing access denied');
    return <AccessDenied />;
  }

  //console.log('AdminRoute - User is admin or instructor, allowing access');
  // If user is admin or instructor, render the protected component
  return <>{children}</>;
};

export default AdminRoute;
