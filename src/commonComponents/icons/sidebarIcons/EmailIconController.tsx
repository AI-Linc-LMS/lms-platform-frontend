import React from "react";
import { useLocation } from "react-router-dom";
import EmailIcon from "./EmailIcons";

const EmailIconController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/";

  return <EmailIcon isActive={isActive} />;
};

export default EmailIconController;

