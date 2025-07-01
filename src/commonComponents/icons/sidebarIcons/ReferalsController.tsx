import React from "react";
import { useLocation } from "react-router-dom";
import ReferalsIcon from "./ReferalsIcon";

const ReferalsController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/admin/referals";

  return <ReferalsIcon isActive={isActive} />;
};

export default ReferalsController;