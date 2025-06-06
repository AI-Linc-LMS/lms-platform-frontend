import React from "react";
import { useLocation } from "react-router-dom";
import ManageStudentsIcon from "./Managestudents";

const ManagestudentsController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/admin/manage-students";

  return <ManageStudentsIcon isActive={isActive} />;
};

export default ManagestudentsController;
