import React from "react";
import adminDashboardActive from "../../icons/admin/nav/dashboardActive.png";
import adminDashboardInactive from "../../icons/admin/nav/dashboard.png";
interface AdminDashboardIconProps {
  isActive: boolean;
}

const AdminDashboardIcon: React.FC<AdminDashboardIconProps> = ({ isActive }) => {
  return (
    <img src={isActive ? adminDashboardActive : adminDashboardInactive} alt="Admin Dashboard" />
  );
};

export default AdminDashboardIcon; 