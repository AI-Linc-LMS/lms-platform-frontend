import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';
import { setUser } from '../redux/slices/userSlice';
import { refreshToken } from '../services/authApis';
import { handleMobileNavigation } from '../utils/authRedirectUtils';

// Calculate refresh threshold as a percentage of token lifetime (refresh at 90% of token lifetime)
// This is a relative value, not hardcoded
const REFRESH_PERCENTAGE = 0.9;

// Function to decode JWT and get expiration time
const getTokenExpirationTime = (token: string): number => {
  try {
    // Split the token and get the payload part (second part)
    const base64Url = token.split('.')[1];
    if (!base64Url) return 0;
    
    // Replace characters for valid base64 and decode
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    // Parse the payload and get the exp field
    const { exp } = JSON.parse(jsonPayload);
    
    // Convert exp to milliseconds
    return exp ? exp * 1000 : 0;
  } catch (error) {
    console.error('Error decoding token:', error);
    return 0;
  }
};

// Function to get the issue time of a token
const getTokenIssueTime = (token: string): number => {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return 0;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { iat } = JSON.parse(jsonPayload);
    
    // Convert iat to milliseconds
    return iat ? iat * 1000 : 0;
  } catch (error) {
    console.error('Error getting token issue time:', error);
    return 0;
  }
};

export const useTokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;

  const handleTokenRefresh = useCallback(async () => {
    try {
      if (!clientId) {
        console.error('Client ID not available, cannot refresh token');
        return false;
      }

      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return false;
      
      const user = JSON.parse(userData);
      const refreshTokenValue = user.refresh_token;
      
      if (!refreshTokenValue) return false;

      // Attempt to refresh the token
      const refreshResponse = await refreshToken(refreshTokenValue, clientId);
      
      // Update tokens in user state
      const updatedUser = {
        ...user,
        access_token: refreshResponse.access_token,
        refresh_token: refreshResponse.refresh_token,
      };
      
      // Update localStorage
      localStorage.setItem('token', refreshResponse.access_token);
      
      // Update Redux store
      dispatch(setUser(updatedUser));
      
      console.log('Token refreshed successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  }, [dispatch, clientId]);

  const checkTokenExpiration = useCallback(async () => {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const accessToken = user.access_token;
      
      if (!accessToken) return;
      
      // Get token expiration time by decoding it
      const expirationTime = getTokenExpirationTime(accessToken);
      if (!expirationTime) {
        console.warn('Could not decode token expiration time');
        return;
      }
      
      const currentTime = Date.now();
      const issueTime = getTokenIssueTime(accessToken);
      
      // If we have both issue and expiration time, we can calculate dynamic refresh time
      let refreshThresholdMs = 5 * 60 * 1000; // Default 5 minutes if we can't calculate
      
      if (issueTime && expirationTime) {
        const tokenLifetimeMs = expirationTime - issueTime;
        // Set refresh threshold to 90% of token lifetime
        refreshThresholdMs = tokenLifetimeMs * (1 - REFRESH_PERCENTAGE);
        console.log(`Token lifetime: ${Math.floor(tokenLifetimeMs / 1000)} seconds, will refresh ${Math.floor(refreshThresholdMs / 1000)} seconds before expiration`);
      }
      
      // Calculate time until expiration
      const timeUntilExpiration = expirationTime - currentTime;
      console.log(`Token expires in ${Math.floor(timeUntilExpiration / 1000)} seconds`);
      
      // If token is within refresh threshold of expiration, try to refresh it
      if (timeUntilExpiration > 0 && timeUntilExpiration < refreshThresholdMs) {
        console.log('Token approaching expiration, attempting refresh...');
        await handleTokenRefresh();
        return;
      }
      
      // If token has expired, try refresh or log out
      if (timeUntilExpiration <= 0) {
        console.log('Token has expired. Attempting final refresh...');
        const refreshSuccess = await handleTokenRefresh();
        
        if (!refreshSuccess) {
          console.log('Final refresh failed. Logging out...');
          performLogout();
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  }, [dispatch, navigate, handleTokenRefresh]);
  
  // Extract logout logic to a separate function
  const performLogout = useCallback(() => {
    // Clear user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenTimestamp'); // Remove legacy timestamp
    
    // Dispatch logout action
    dispatch(logout());
    
    // Redirect to login page using mobile navigation
    handleMobileNavigation('/login', navigate);
  }, [dispatch, navigate]);

  useEffect(() => {
    // Check token expiration on mount
    checkTokenExpiration();
    
    // Calculate interval based on token lifetime (check more frequently for shorter-lived tokens)
    // For now, use 30 seconds as a reasonable default
    const intervalId = setInterval(checkTokenExpiration, 30 * 1000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [checkTokenExpiration]);

  // Return the check function and logout function if needed elsewhere
  return { checkTokenExpiration, performLogout };
}; 