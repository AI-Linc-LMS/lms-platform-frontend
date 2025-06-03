import React from "react";
import { useLocation } from "react-router-dom";
import AdminDashboardIcon from "./AdminDashboardIcon";

const AdminDashboardController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/admin/dashboard";

  return <AdminDashboardIcon isActive={isActive} />;
};

export default AdminDashboardController; 