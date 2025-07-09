import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setUser } from '../redux/slices/userSlice';
import { googleLogin } from '../services/authApis';
import { clearAnonymousUserId } from '../utils/userIdHelper';
import { useAuthRedirect } from '../contexts/AuthRedirectContext';
import { handlePostLoginNavigation, waitForAuthState } from '../utils/authRedirectUtils';
import axios from 'axios';

export const useGoogleAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const clientId = import.meta.env.VITE_CLIENT_ID;
  const { intendedPath, clearIntendedPath } = useAuthRedirect();

  const handleGoogleLogin = async (googleToken: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { access_token, refresh_token, user } = await googleLogin(googleToken, clientId);

      //console.log('Google login response:', { access_token, refresh_token, user });
      
      // Store token in localStorage
      localStorage.setItem('token', access_token);
      
      // Clear anonymous user ID since user is now authenticated
      clearAnonymousUserId();
      
      // Update Redux store with user data
      dispatch(
        setUser({
          id: user.id,
          access_token,
          refresh_token,
          email: user.email,
          full_name: user.full_name,
          username: user.username,
          profile_picture: user.profile_picture,
          phone_number: user.phone_number,
          role: user.role,
          isAuthenticated: true,
        })
      );

      // Wait for authentication state to be properly set
      await waitForAuthState();

      // Redirect to intended path if available, otherwise go to home
      if (intendedPath) {
        await handlePostLoginNavigation(intendedPath, navigate, true);
        clearIntendedPath(); // Clear the intended path after redirecting
      } else {
        await handlePostLoginNavigation('/', navigate, true);
      }
    } catch (err) {
      //console.error('Google login error:', err);
      setIsLoading(false);
      
      // Enhanced error handling
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 401) {
          setError('Invalid Google credentials. Please try again.');
        } else if (err.response && err.response.status >= 500) {
          setError('Server error. Please try again later.');
        } else if (err.code === 'NETWORK_ERROR' || !err.response) {
          setError('Network error. Please check your connection and try again.');
        } else {
          setError(err.response?.data?.message || 'Login failed. Please try again.');
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    }
  };

  return {
    handleGoogleLogin,
    isLoading,
    error,
  };
}; 