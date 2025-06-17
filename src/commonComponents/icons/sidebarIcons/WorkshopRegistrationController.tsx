import React from "react";
import { useLocation } from "react-router-dom";
import WorkshopRegistrationIcon from "./WorkshopRegistrationIcon";

const WorkshopRegistrationController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/admin/workshop-registrations";

  return <WorkshopRegistrationIcon isActive={isActive} />;
};

export default WorkshopRegistrationController;