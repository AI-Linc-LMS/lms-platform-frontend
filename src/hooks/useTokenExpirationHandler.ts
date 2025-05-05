import { useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

// Default token timeout in milliseconds (30 minutes)
const DEFAULT_TOKEN_TIMEOUT = 30 * 60 * 1000;

export const useTokenExpirationHandler = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const checkTokenExpiration = useCallback(() => {
    try {
      // Check if user data exists in localStorage
      const userData = localStorage.getItem('user');
      if (!userData) return;
      
      const user = JSON.parse(userData);
      const accessToken = user.access_token;
      
      if (!accessToken) return;
      
      // Get the token's last refresh time from localStorage or set current time if not found
      const tokenTimestamp = localStorage.getItem('tokenTimestamp');
      const lastRefreshTime = tokenTimestamp ? parseInt(tokenTimestamp, 10) : Date.now();
      
      // Calculate elapsed time since the token was issued/refreshed
      const currentTime = Date.now();
      const elapsedTime = currentTime - lastRefreshTime;
      
      // Check if token has expired (default 30 minutes)
      if (elapsedTime > DEFAULT_TOKEN_TIMEOUT) {
        console.log('Token has expired. Logging out...');
        
        // Clear user data from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('tokenTimestamp');
        
        // Dispatch logout action
        dispatch(logout());
        
        // Redirect to login page
        navigate('/login');
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    // Check token expiration on mount
    checkTokenExpiration();
    
    // Set up periodic check every minute
    const intervalId = setInterval(checkTokenExpiration, 60 * 1000);
    
    // Clear interval on unmount
    return () => clearInterval(intervalId);
  }, [checkTokenExpiration]);

  // Return the check function if needed elsewhere
  return { checkTokenExpiration };
}; 