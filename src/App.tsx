import "./App.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import routes from "./routes";
import Container from "./constants/Container";
import { Outlet } from "react-router-dom";
import { useEffect, useState, Suspense } from "react";
import { useTokenExpirationHandler } from "./hooks/useTokenExpirationHandler";
import useUserActivityTracking from "./hooks/useUserActivityTracking";
import { setupActivitySyncListeners } from "./utils/userActivitySync";
import { ToastProvider } from "./contexts/ToastContext";
import { ToastContainer } from "./components/ToastContainer";
import { PWAProvider } from "./components/PWAProvider";
import { IOSPWAInstallPrompt } from "./components/IOSPWAInstallPrompt";
import AdminRoute from "./commonComponents/private-route/AdminRoute";
import {
  AuthRedirectProvider,
  useAuthRedirect,
} from "./contexts/AuthRedirectContext";
import {
  shouldStoreIntendedPath,
  getFullPath,
  handleMobileNavigation,
} from "./utils/authRedirectUtils";
// import FloatingActivityTimer from "./components/FloatingActivityTimer";
import { CommunityPage, ThreadDetailPage } from "./features/community";
import LoadingSpinner from "./commonComponents/loading-spinner/LoadingSpinner";

function App() {
  return (
    <AuthRedirectProvider>
      <ToastProvider>
        <Router>
          <PWAProvider>
            <AppContent />
          </PWAProvider>
          <ToastContainer />
        </Router>
      </ToastProvider>
    </AuthRedirectProvider>
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
    handleMobileNavigation("/", navigate, true, false);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--neutral-50)]">
      <div className="flex items-center space-x-2 mb-8">
        <div className="text-6xl font-mono text-[var(--primary-700)]">
          {"{"}
        </div>
        <div
          className={`text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-700)] to-[#9F55FF] ${
            animateNumber ? "animate-bounce" : ""
          }`}
        >
          404
        </div>
        <div className="text-6xl font-mono text-[var(--primary-700)]">
          {"}"}
        </div>
      </div>

      <div className="text-center max-w-md mb-8">
        <div className="font-mono text-[var(--primary-700)] text-xl">
          <span className="text-[#9F55FF]">error</span>:{" "}
          <span className="text-[var(--neutral-500)]">Page</span>.
          <span className="text-[var(--primary-700)]">NotFound</span>()
        </div>
        <p className="text-gray-600 mt-4 font-mono">
          // The requested resource could not be located
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button
          onClick={handleGoHome}
          className="px-6 py-3 bg-[var(--primary-500)] rounded-xl text-[var(--font-light)] hover:bg-[var(--primary-600)] transition-all duration-300 shadow-lg hover:shadow-[var(--primary-700)]/30 flex items-center justify-center hover:scale-95 font-mono"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
          </svg>
          return home()
        </button>

        <button
          onClick={handleGoBack}
          className="px-6 py-3 bg-[var(--neutral-100)] text-[var(--neutral-500)] rounded-xl hover:bg-[var(--neutral-200)] transition-all duration-300 flex items-center justify-center hover:scale-95 font-mono"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z"
              clipRule="evenodd"
            />
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
  const { setIntendedPath } = useAuthRedirect();

  useEffect(() => {
    // If user is not authenticated, redirect to login
    if (!user) {
      // Don't redirect if user is already on login or auth-related pages
      const currentPath = location.pathname;
      const authPages = ["/login", "/signup", "/forgot-password", "/otp"];

      if (authPages.includes(currentPath)) {
        return; // Don't redirect if already on an auth page
      }

      // Store the current path as intended destination before redirecting to login
      const fullPath = getFullPath(location.pathname, location.search);
      if (shouldStoreIntendedPath(fullPath)) {
        setIntendedPath(fullPath);
      }
      handleMobileNavigation("/login", navigate, true, false);
      return;
    }

    // Get the current path
    const path = location.pathname;

    // First check if the current path is a valid route
    // This will handle cases where user manually enters a URL like /learn/course/3
    const isCurrentPathValid = routes.some((route) => {
      // Convert route path patterns (with :params) to regex patterns for matching
      const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${routePattern}$`);
      return regex.test(path);
    });

    // If current path is valid, don't redirect - let the router handle it
    if (isCurrentPathValid) {
      return;
    }

    // For root level random paths, show 404 page
    if (path.split("/").length === 2 && path !== "/") {
      // This is a root level path like /unknown
      const isKnownRootPath = routes.some((route) => {
        const routeSegments = route.path.split("/");
        return (
          routeSegments.length === 2 && routeSegments[1] === path.substring(1)
        );
      });

      if (!isKnownRootPath) {
        setShowNotFound(true);
        return;
      }
    }

    // Special handling for course routes like: /learn/course/3/3/690634646
    if (path.startsWith("/learn/course/")) {
      const segments = path.split("/");

      // Check if this could be a valid parent route by removing segments one by one
      // and checking against routes
      for (let i = segments.length - 1; i >= 3; i--) {
        const possibleValidPath = segments.slice(0, i).join("/");

        // Check if this is a valid route
        const isValidParentRoute = routes.some((route) => {
          const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(possibleValidPath);
        });

        if (isValidParentRoute) {
          // If we found a valid parent path, navigate to it
          handleMobileNavigation(possibleValidPath, navigate, true, false);
          return;
        }
      }

      // If we've tried all parent paths and none are valid, show 404
      setShowNotFound(true);
      return;
    }

    // For other routes, try to find the closest matching valid route
    if (path.split("/").length > 2) {
      // Try to find a valid parent path by removing segments one by one
      const segments = path.split("/");

      for (let i = segments.length - 1; i >= 2; i--) {
        const possibleValidPath = segments.slice(0, i).join("/") || "/";

        // Check if this is a valid route
        const isValidParentRoute = routes.some((route) => {
          const routePattern = route.path.replace(/:[^/]+/g, "[^/]+");
          const regex = new RegExp(`^${routePattern}$`);
          return regex.test(possibleValidPath);
        });

        if (isValidParentRoute) {
          // If we found a valid parent path, navigate to it
          handleMobileNavigation(possibleValidPath, navigate, true, false);
          return;
        }
      }
    }

    // If we couldn't find any valid parent path, show 404
    setShowNotFound(true);
  }, [navigate, user, location, setIntendedPath]);

  // Return 404 page if showNotFound is true
  return showNotFound ? <NotFound /> : null;
};

// Separate component to use Router hooks
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const isAuthenticated = user && token ? true : false;
  const { totalTimeSpent, activityHistory } = useUserActivityTracking();
  const { setIntendedPath } = useAuthRedirect();

  // Add debugging logs
  //console.log("[App] Current path:", location.pathname);
  //console.log("[App] User in localStorage:", !!user);
  //console.log("[App] Token in localStorage:", !!token);
  //console.log("[App] isAuthenticated:", isAuthenticated);

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
      //console.log("Current session stats:");
      //console.log("Total time spent:", totalTimeSpent, "seconds");
      //console.log("Session history:", activityHistory);
      // In the future, this is where you would sync with backend
      // syncUserActivity(userId, totalTimeSpent, activityHistory);
    }, 60000); // Log every minute

    return () => clearInterval(logInterval);
  }, [isAuthenticated, totalTimeSpent, activityHistory]);

  useEffect(() => {
    //console.log("[App] Authentication check useEffect triggered");
    //console.log("[App] isAuthenticated:", isAuthenticated);
    //console.log("[App] Current path:", location.pathname);

    if (!isAuthenticated) {
      // Don't redirect if user is already on login or auth-related pages
      const currentPath = location.pathname;
      const authPages = ["/login", "/signup", "/forgot-password", "/otp"];

      //console.log("[App] User not authenticated, current path:", currentPath);

      if (authPages.includes(currentPath)) {
        //console.log("[App] Already on auth page, not redirecting");
        return; // Don't redirect if already on an auth page
      }

      //console.log("[App] Not on auth page, redirecting to login");

      // Store the current path as intended destination before redirecting to login
      const fullPath = getFullPath(location.pathname, location.search);
      if (shouldStoreIntendedPath(fullPath)) {
        setIntendedPath(fullPath);
      }
      handleMobileNavigation("/login", navigate, true, false);
    } else {
      //console.log("[App] User is authenticated, staying on current page");
    }
  }, [isAuthenticated, navigate, location, setIntendedPath]);

  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
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
                  <Route
                    index
                    element={
                      route.requiredRole === "admin_or_instructor" ? (
                        <AdminRoute>
                          <route.component />
                        </AdminRoute>
                      ) : (
                        <route.component />
                      )
                    }
                  />
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
          <Route path="/community" element={<CommunityPage />} />
          <Route
            path="/community/thread/:threadId"
            element={<ThreadDetailPage />}
          />

          {/* Handle unknown routes - keeps authenticated users on the app */}
          <Route path="*" element={<InvalidRoute />} />
        </Routes>
      </Suspense>

      {/* Only show FloatingActivityTimer when authenticated and not on login/register pages */}
      {/* Commented out per instructions */}
      {/* {isAuthenticated && 
       location.pathname !== '/login' && 
       location.pathname !== '/register' && 
       location.pathname !== '/signup' && 
       location.pathname !== '/forgot-password' && 
       location.pathname !== '/otp' && (
        <FloatingActivityTimer />
      )} */}

      {/* iOS PWA Installation Prompt */}
      <IOSPWAInstallPrompt appName="AiLinc" />
    </>
  );
}

export default App;
