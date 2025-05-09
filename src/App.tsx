import "./App.css";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";
import { useTokenExpirationHandler } from "./hooks/useTokenExpirationHandler";

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// 404 Not Found component
const NotFound = () => {
  const navigate = useNavigate();
  const [animateNumber, setAnimateNumber] = useState(false);
  
  useEffect(() => {
    // Add animation after component mounts
    setTimeout(() => setAnimateNumber(true), 300);
  }, []);
  
  const handleGoHome = () => {
    navigate('/', { replace: true });
  };
  
  const handleGoBack = () => {
    window.history.back();
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA]">
      <div className="flex items-center space-x-2 mb-8">
        <div className="text-6xl font-mono text-[#1A5A7A]">{'{'}</div>
        <div className={`text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#1A5A7A] to-[#9F55FF] ${animateNumber ? 'animate-bounce' : ''}`}>
          404
        </div>
        <div className="text-6xl font-mono text-[#1A5A7A]">{'}'}</div>
      </div>
      
      <div className="text-center max-w-md mb-8">
        <div className="font-mono text-[#1A5A7A] text-xl">
          <span className="text-[#9F55FF]">error</span>: <span className="text-[#343A40]">Page</span>.<span className="text-[#1A5A7A]">NotFound</span>()
        </div>
        <p className="text-gray-600 mt-4 font-mono">
          // The requested resource could not be located
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button 
          onClick={handleGoHome}
          className="px-6 py-3 bg-[#255C79] rounded-xl text-white hover:bg-[#1E4A63] transition-all duration-300 shadow-lg hover:shadow-[#1A5A7A]/30 flex items-center justify-center hover:scale-95 font-mono"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          return home()
        </button>
        
        <button 
          onClick={handleGoBack}
          className="px-6 py-3 bg-[#E9ECEF] text-[#343A40] rounded-xl hover:bg-[#DDE2E6] transition-all duration-300 flex items-center justify-center hover:scale-95 font-mono"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          goBack()
        </button>
      </div>
    </div>
  );
};

// Component to handle invalid routes
const InvalidRoute = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = localStorage.getItem("user");
  const [showNotFound, setShowNotFound] = useState(false);
  
  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Try to correct the URL to a valid parent route
    const path = location.pathname;
    
    // For root level random paths, show 404 page
    if (path.split('/').length === 2 && path !== '/') {
      // This is a root level path like /unknown
      const isKnownRootPath = routes.some(route => {
        const routeSegments = route.path.split('/');
        return routeSegments.length === 2 && routeSegments[1] === path.substring(1);
      });
      
      if (!isKnownRootPath) {
        setShowNotFound(true);
        return;
      }
    }
    
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
      } else {
        // If it's a root level route that wasn't caught earlier, show 404
        setShowNotFound(true);
      }
    }
  }, [navigate, user, location]);

  // Return 404 page if showNotFound is true
  return showNotFound ? <NotFound /> : null;
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
