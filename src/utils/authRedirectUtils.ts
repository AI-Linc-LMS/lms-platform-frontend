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