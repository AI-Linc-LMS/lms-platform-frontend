import React from "react";
import { useLocation } from "react-router-dom";
import DashboardIcon from "./Dashboardicon";

const DashboardController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/";

  return <DashboardIcon isActive={isActive} />;
};

export default DashboardController;

