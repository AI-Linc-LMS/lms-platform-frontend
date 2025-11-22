/**
 * Utility functions for handling user identification in activity tracking
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Gets the authenticated user's ID from localStorage
 * @returns The user ID if authenticated, null if not
 */
export const getAuthenticatedUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || null;
    }
    return null;
  } catch {
    // Silently handle parsing errors
    return null;
  }
};

/**
 * Gets or generates a unique anonymous user ID for non-authenticated users
 * This ensures each browser/device has a consistent anonymous ID
 * The ID looks like a regular user ID without any "anonymous" prefix
 * @returns A unique anonymous user ID
 */
export const getAnonymousUserId = (): string => {
  const ANONYMOUS_USER_ID_KEY = 'anonymous_user_id';
  
  try {
    let anonymousId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
    
    // Check if we have an old format ID with "anonymous_" prefix and migrate it
    if (anonymousId && anonymousId.startsWith('anonymous_')) {
      // Extract the UUID part after "anonymous_"
      const cleanId = anonymousId.replace('anonymous_', '');
      // Validate that it's a proper UUID format
      if (cleanId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        anonymousId = cleanId;
        localStorage.setItem(ANONYMOUS_USER_ID_KEY, anonymousId);
      } else {
        // If it's not a valid UUID, generate a new one
        anonymousId = null;
      }
    }
    
    if (!anonymousId) {
      // Generate a clean UUID that looks like a regular user ID
      anonymousId = uuidv4();
      localStorage.setItem(ANONYMOUS_USER_ID_KEY, anonymousId);
    }
    
    return anonymousId;
  } catch {
    // Fallback to a session-based clean ID if localStorage fails
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Gets the current user ID (authenticated user ID or anonymous user ID)
 * This is the main function to use for user identification in activity tracking
 * @returns User ID string
 */
export const getCurrentUserId = (): string => {
  const authenticatedUserId = getAuthenticatedUserId();
  
  if (authenticatedUserId) {
    return authenticatedUserId;
  }
  
  return getAnonymousUserId();
};

/**
 * Clears the anonymous user ID (useful when user logs in)
 * This prevents confusion between anonymous and authenticated sessions
 */
export const clearAnonymousUserId = (): void => {
  try {
    localStorage.removeItem('anonymous_user_id');
  } catch {
    // Silently handle storage errors
  }
};

/**
 * Forces regeneration of anonymous user ID (useful for testing or migration)
 * This will clear the existing anonymous ID and generate a new clean one
 */
export const regenerateAnonymousUserId = (): string => {
  try {
    localStorage.removeItem('anonymous_user_id');
    return getAnonymousUserId(); // This will generate a new clean ID
  } catch {
    // Fallback to direct UUID generation
    return uuidv4();
  }
};

/**
 * Handles user login by clearing anonymous data and ensuring proper account identification
 * This should be called when a user successfully logs in
 */
export const handleUserLogin = (): void => {
  try {
    // Clear anonymous user ID since we now have an authenticated user
    clearAnonymousUserId();
    
    // Log the account switch for debugging
    const authenticatedUserId = getAuthenticatedUserId();
    if (authenticatedUserId) {
    }
  } catch {
    // Error handling user login
  }
};

/**
 * Handles user logout by clearing user data
 * This should be called when a user logs out
 */
export const handleUserLogout = (): void => {
  try {
    // User data will be cleared by the auth system
    // We'll generate a new anonymous ID for the next session
    regenerateAnonymousUserId();
    
  } catch {
    // Error handling user logout
  }
};

/**
 * Gets user identification info for debugging/display purposes
 */
export const getUserIdentificationInfo = () => {
  const authenticatedUserId = getAuthenticatedUserId();
  const anonymousUserId = getAnonymousUserId();
  const currentUserId = getCurrentUserId();
  
  return {
    authenticatedUserId,
    anonymousUserId,
    currentUserId,
    isAuthenticated: !!authenticatedUserId,
    userType: authenticatedUserId ? 'authenticated' : 'anonymous'
  };
}; 