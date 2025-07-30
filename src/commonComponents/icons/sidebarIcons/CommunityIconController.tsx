import React from "react";
import { useLocation } from "react-router-dom"; 
import CommunityIcon from "./CommunityIcons";

const CommunityIconController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/community";

  return <CommunityIcon isActive={isActive} />;
};  

export default CommunityIconController;