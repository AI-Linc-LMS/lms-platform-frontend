import "./App.css";
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Outlet } from 'react-router-dom';
import { useEffect } from "react";

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
  const user = localStorage.getItem("user");
  const isAuthenticated = user ? true : false;
  console.log("user", user);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <Routes>
      {routes.map((route) => {
        if (route.isPrivate) {
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
