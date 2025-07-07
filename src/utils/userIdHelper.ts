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
  } catch (error) {
    //console.error('Error parsing user data from localStorage:', error);
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
  } catch (error) {
    //console.error('Error handling anonymous user ID:', error);
    // Fallback to a session-based clean ID if localStorage fails
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};

/**
 * Gets the current user ID - either authenticated user ID or unique anonymous ID
 * This ensures every user (authenticated or not) has a unique identifier
 * @returns A unique user identifier
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
  } catch (error) {
    //console.error('Error clearing anonymous user ID:', error);
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
  } catch (error) {
    //console.error('Error regenerating anonymous user ID:', error);
    return uuidv4(); // Fallback to direct UUID generation
  }
}; 