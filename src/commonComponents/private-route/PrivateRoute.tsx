import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAppSelector } from "../../redux/store";

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
