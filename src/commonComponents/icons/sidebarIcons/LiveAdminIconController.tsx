import React from "react";
import { useLocation } from "react-router-dom";
import LiveIcon from "./LiveIcon";

const LiveAdminIconController: React.FC = () => {
  const location = useLocation();
  // Live is active when the path includes '/live'
  const isActive = location.pathname.includes("/live");

  return <LiveIcon isActive={isActive} />;
};

export default LiveAdminIconController;
