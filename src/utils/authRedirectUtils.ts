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
 */
export const handleMobileNavigation = (
  path: string, 
  navigate: (path: string, options?: { replace?: boolean }) => void,
  replace: boolean = true
) => {
  const isMobile = isMobileDevice();
  
  if (isMobile) {
    // For mobile devices, use window.location.href to ensure proper navigation
    console.log('[Mobile Navigation] Using window.location.href for:', path);
    window.location.href = path;
  } else {
    // For desktop, use React Router navigation
    console.log('[Desktop Navigation] Using React Router navigate for:', path);
    navigate(path, { replace });
  }
};

/**
 * Waits for authentication state to be properly set before navigation
 * This helps prevent blank pages on mobile devices
 */
export const waitForAuthState = (timeoutMs: number = 500): Promise<void> => {
  return new Promise((resolve) => {
    const checkAuth = () => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      if (user && token) {
        resolve();
      } else {
        setTimeout(checkAuth, 50);
      }
    };
    
    checkAuth();
    
    // Fallback timeout
    setTimeout(resolve, timeoutMs);
  });
}; 