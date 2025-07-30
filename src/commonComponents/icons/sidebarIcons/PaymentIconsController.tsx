import React from "react";
import { useLocation } from "react-router-dom";
import PaymentLinksIcon from "./PaymentLinksIcon";

const PaymentIconsController: React.FC = () => {
  const location = useLocation();
  const isActive = location.pathname === "/admin/payment-links";

  return <PaymentLinksIcon isActive={isActive} />;
};

export default PaymentIconsController;
