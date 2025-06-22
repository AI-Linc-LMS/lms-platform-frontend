/**
 * Utility functions for handling authentication redirects
 */

export const shouldStoreIntendedPath = (path: string): boolean => {
  const excludedPaths = ['/login', '/signup', '/forgot-password'];
  return !excludedPaths.includes(path);
};

export const getFullPath = (pathname: string, search: string): string => {
  return pathname + search;
};

export const logRedirectInfo = (intendedPath: string | null, currentPath: string, action: string) => {
  console.log(`[Auth Redirect] ${action}:`, {
    intendedPath,
    currentPath,
    timestamp: new Date().toISOString()
  });
};

/**
 * Detects if the current device is mobile
 */
export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Handles navigation with mobile-specific logic
 * @param path - The path to navigate to
 * @param navigate - React Router navigate function
 * @param replace - Whether to replace the current history entry
 * @param forceReload - Whether to force a full page reload (use sparingly)
 */
export const handleMobileNavigation = (
  path: string, 
  navigate: (path: string, options?: { replace?: boolean }) => void,
  replace: boolean = true,
  forceReload: boolean = false
) => {
  const isMobile = isMobileDevice();
  const currentPath = window.location.pathname;
  
  console.log('[Mobile Navigation] Navigating to:', path, 'isMobile:', isMobile, 'replace:', replace, 'forceReload:', forceReload);
  console.log('[Mobile Navigation] Current path:', currentPath);
  
  // Prevent unnecessary redirects to the same page
  if (currentPath === path) {
    console.log('[Mobile Navigation] Already on target path, skipping navigation');
    return;
  }
  
  if (isMobile && forceReload) {
    // Only use window.location.href when explicitly requested (like after successful login)
    console.log('[Mobile Navigation] Using window.location.href for:', path);
    window.location.href = path;
  } else {
    // Use React Router navigation for most cases
    console.log('[Navigation] Using React Router navigate for:', path);
    navigate(path, { replace });
  }
};

/**
 * Waits for authentication state to be properly set before navigation
 * This helps prevent blank pages on mobile devices
 */
export const waitForAuthState = (timeoutMs: number = 500): Promise<void> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = Math.floor(timeoutMs / 50); // Calculate max attempts based on timeout
    
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      attempts++;
      
      if (user && token) {
        console.log('[Auth State] Authentication state found, proceeding with navigation');
        resolve();
      } else if (attempts >= maxAttempts) {
        console.log('[Auth State] Timeout reached, proceeding with navigation anyway');
        resolve();
      } else {
        setTimeout(checkAuth, 50);
      }
    };
    
    checkAuth();
  });
}; 