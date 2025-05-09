import "./App.css";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Outlet } from 'react-router-dom';
import { useEffect } from "react";
import { useTokenExpirationHandler } from "./hooks/useTokenExpirationHandler";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Component to handle invalid routes
const InvalidRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = localStorage.getItem("user");
  
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Try to correct the URL to a valid parent route
    const path = location.pathname;
    
    // Special handling for course routes like: /learn/course/3/3/690634646
    // Valid pattern should be: /learn/course/:courseId/:submoduleId
    if (path.startsWith('/learn/course/')) {
      const segments = path.split('/');
      
      // If we have more segments than expected in a course route (/learn/course/courseId/submoduleId)
      if (segments.length > 5) {
        // Keep only the first 5 segments (including the empty first segment)
        const validPath = segments.slice(0, 5).join('/');
        navigate(validPath, { replace: true });
        return;
      }
    }
    
    // For other routes, try to find the closest matching valid route
    const isValidRoute = routes.some(route => {
      // Convert route path patterns (with :params) to regex patterns
      const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    });
    
    if (!isValidRoute) {
      // If no valid route is found, try to find the parent path
      const segments = path.split('/');
      if (segments.length > 2) {
        // Remove the last segment and redirect to parent path
        const parentPath = segments.slice(0, -1).join('/') || '/';
        navigate(parentPath, { replace: true });
      }
    }
  }, [navigate, user, location]);

  // Return null as this component just handles redirection
  return null;
};

// Separate component to use Router hooks
function AppContent() {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const isAuthenticated = user ? true : false;
  console.log("user", user);
  
  // Use the token expiration handler
  useTokenExpirationHandler();
  
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
      
      {/* Handle unknown routes - keeps authenticated users on the app */}
      <Route path="*" element={<InvalidRoute />} />
    </Routes>
  );
}

export default App;
