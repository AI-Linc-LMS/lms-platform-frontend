import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import AdminContainer from "./constants/AdminContainer";
import { Outlet } from 'react-router-dom';
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "./redux/store";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Separate component to use Router hooks
function AppContent() {
  const navigate = useNavigate();
  const user = useSelector((state: RootState) => state.user);
  const isAuthenticated = user.isAuthenticated;
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <Routes>
      {routes.map((route) => {
        if (route.isPrivate) {
          // Handle admin routes
          if (route.isAdmin) {
            return (
              <Route
                key={route.path}
                path={route.path}
                element={
                  <AdminContainer>
                    <Outlet />
                  </AdminContainer>
                }
              >
                <Route index element={<route.component />} />
              </Route>
            );
          }
          
          // Regular private routes
          return (
            <Route
              key={route.path}
              path={route.path}
              element={
                <Container>
                  <Outlet />
                </Container>
              }
            >
              <Route index element={<route.component />} />
            </Route>
          );
        }

        // Public routes
        return (
          <Route
            key={route.path}
            path={route.path}
            element={<route.component />}
          />
        );
      })}
      
      {/* Redirect to login for any unmatched routes */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
