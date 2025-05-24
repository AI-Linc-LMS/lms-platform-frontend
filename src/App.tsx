import "./App.css";
import { BrowserRouter as Router, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Outlet } from 'react-router-dom';
import { useEffect, useState } from "react";
import { useTokenExpirationHandler } from "./hooks/useTokenExpirationHandler";
import useUserActivityTracking from "./hooks/useUserActivityTracking";
import { setupActivitySyncListeners } from "./utils/userActivitySync";
import FloatingActivityTimer from "./components/FloatingActivityTimer";

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
    
    // Get the current path
    const path = location.pathname;
    
    // First check if the current path is a valid route
    // This will handle cases where user manually enters a URL like /learn/course/3
    const isCurrentPathValid = routes.some(route => {
      // Convert route path patterns (with :params) to regex patterns for matching
      const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    });
    
    // If current path is valid, don't redirect - let the router handle it
    if (isCurrentPathValid) {
      return;
    }
    
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
    if (path.startsWith('/learn/course/')) {
      const segments = path.split('/');
      
      // Check if this could be a valid parent route by removing segments one by one
      // and checking against routes
      for (let i = segments.length - 1; i >= 3; i--) {
        const possibleValidPath = segments.slice(0, i).join('/');
        
        // Check if this is a valid route
        const isValidParentRoute = routes.some(route => {
          const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(possibleValidPath);
        });
        
        if (isValidParentRoute) {
          // If we found a valid parent path, navigate to it
          navigate(possibleValidPath, { replace: true });
          return;
        }
      }
      
      // If we've tried all parent paths and none are valid, show 404
      setShowNotFound(true);
      return;
    }
    
    // For other routes, try to find the closest matching valid route
    if (path.split('/').length > 2) {
      // Try to find a valid parent path by removing segments one by one
      const segments = path.split('/');
      
      for (let i = segments.length - 1; i >= 2; i--) {
        const possibleValidPath = segments.slice(0, i).join('/') || '/';
        
        // Check if this is a valid route
        const isValidParentRoute = routes.some(route => {
          const routePattern = route.path.replace(/:[^/]+/g, '[^/]+');
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(possibleValidPath);
        });
        
        if (isValidParentRoute) {
          // If we found a valid parent path, navigate to it
          navigate(possibleValidPath, { replace: true });
          return;
        }
      }
    }
    
    // If we couldn't find any valid parent path, show 404
    setShowNotFound(true);
  }, [navigate, user, location]);

  // Return 404 page if showNotFound is true
  return showNotFound ? <NotFound /> : null;
};

// Separate component to use Router hooks
function AppContent() {
  const navigate = useNavigate();
  const user = localStorage.getItem("user");
  const isAuthenticated = user ? true : false;
  const { totalTimeSpent, activityHistory } = useUserActivityTracking();
  
  // Use the token expiration handler
  useTokenExpirationHandler();
  
  // Set up activity sync listeners
  useEffect(() => {
    if (isAuthenticated) {
      setupActivitySyncListeners();
    }
  }, [isAuthenticated]);
  
  // Log activity data periodically
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const logInterval = setInterval(() => {
      console.log('Current session stats:');
      console.log('Total time spent:', totalTimeSpent, 'seconds');
      console.log('Session history:', activityHistory);
      
      // In the future, this is where you would sync with backend
      // syncUserActivity(userId, totalTimeSpent, activityHistory);
    }, 60000); // Log every minute
    
    return () => clearInterval(logInterval);
  }, [isAuthenticated, totalTimeSpent, activityHistory]);
  
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <>
      {isAuthenticated && <FloatingActivityTimer />}
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
    </>
  );
}

export default App;
