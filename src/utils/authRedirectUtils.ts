/**
 * Utility functions for handling authentication redirects
 */

export const shouldStoreIntendedPath = (path: string): boolean => {
  const excludedPaths = ['/login', '/signup', '/forgot-password', '/otp'];
  return !excludedPaths.includes(path);
};

export const getFullPath = (pathname: string, search: string): string => {
  return pathname + search;
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
  
  //console.log('[Mobile Navigation] Navigating to:', path, 'isMobile:', isMobile, 'replace:', replace, 'forceReload:', forceReload);
  //console.log('[Mobile Navigation] Current path:', currentPath);
  
  // Prevent unnecessary redirects to the same page
  if (currentPath === path) {
    //console.log('[Mobile Navigation] Already on target path, skipping navigation');
    return;
  }
  
  if (isMobile && forceReload) {
    // Only use window.location.href when explicitly requested (like after successful login)
    //console.log('[Mobile Navigation] Using window.location.href for:', path);
    window.location.href = path;
  } else {
    // Use React Router navigation for most cases
    //console.log('[Navigation] Using React Router navigate for:', path);
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
        //console.log('[Auth State] Authentication state found, proceeding with navigation');
        resolve();
      } else if (attempts >= maxAttempts) {
        //console.log('[Auth State] Timeout reached, proceeding with navigation anyway');
        resolve();
      } else {
        setTimeout(checkAuth, 50);
      }
    };
    
    checkAuth();
  });
};

/**
 * Enhanced authentication state verification for post-login navigation
 * Ensures authentication state is properly persisted before force reload on mobile
 */
export const waitForAuthStatePersistence = (timeoutMs: number = 1000): Promise<void> => {
  return new Promise((resolve) => {
    let attempts = 0;
    const maxAttempts = Math.floor(timeoutMs / 100);
    
    const checkAuthPersistence = () => {
      const user = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      
      attempts++;
      
      if (user && token) {
        // Additional verification - try to parse the user data
        try {
          const userData = JSON.parse(user);
          if (userData && userData.isAuthenticated) {
            //console.log('[Auth Persistence] Authentication state verified and persisted');
            resolve();
            return;
          }
        } catch {
          //console.log('[Auth Persistence] User data not properly formatted, continuing checks');
        }
      }
      
      if (attempts >= maxAttempts) {
        //console.log('[Auth Persistence] Timeout reached, proceeding with navigation anyway');
        resolve();
      } else {
        setTimeout(checkAuthPersistence, 100);
      }
    };
    
    checkAuthPersistence();
  });
};

/**
 * Post-login navigation handler that ensures proper authentication state
 * before force reload on mobile devices
 */
export const handlePostLoginNavigation = async (
  path: string,
  navigate: (path: string, options?: { replace?: boolean }) => void,
  replace: boolean = true
): Promise<void> => {
  const isMobile = isMobileDevice();
  
  //console.log('[Post-Login Navigation] Handling navigation to:', path, 'isMobile:', isMobile);
  
  if (isMobile) {
    // On mobile, wait for authentication state to be properly persisted
    //console.log('[Post-Login Navigation] Waiting for auth state persistence on mobile');
    await waitForAuthStatePersistence(1500); // Longer timeout for mobile
    
    // Add a small additional delay to ensure localStorage is fully synced
    await new Promise(resolve => setTimeout(resolve, 200));
    
    //console.log('[Post-Login Navigation] Using window.location.href for mobile navigation');
    window.location.href = path;
  } else {
    // On desktop, use regular navigation
    //console.log('[Post-Login Navigation] Using React Router navigate for desktop');
    navigate(path, { replace });
  }
}; 